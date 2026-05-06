import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  useAccount,
  useDisconnect,
  useSignMessage,
  useSwitchChain,
} from "wagmi";
import { HttpService } from "@/services/base.service";
import { authService } from "@/services/auth.service";
import { IAdmin } from "@/types/admin.interface";
import { adminService } from "@/services/admin.service";
import { base, baseSepolia } from "wagmi/chains";

const TOKEN_KEY = "mlc_admin_jwt";

const isMainnet = import.meta.env.VITE_NETWORK === "base";
const REQUIRED_CHAIN = isMainnet ? base : baseSepolia;
const REQUIRED_CHAIN_ID = REQUIRED_CHAIN.id;

interface AuthContextProps {
  token: string | null;
  isAuthenticated: boolean;
  clearAuthData: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  address: string | null;
  disconnect: () => void;
}

const AdminContext = createContext<AuthContextProps | undefined>(undefined);

const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize token from storage synchronously
  const storedToken = localStorage.getItem(TOKEN_KEY);
  if (storedToken) {
    HttpService.setToken(storedToken);
  }

  const [token, setToken] = useState<string | null>(storedToken);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const signingRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { address, isConnected, status, connector, chainId } =
    useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { switchChain } = useSwitchChain();

  const isAuthenticated = isConnected && Boolean(address) && Boolean(token);
  const isWrongNetwork = isConnected && chainId !== REQUIRED_CHAIN_ID;

  const {
    data: adminData,
    isLoading: adminQueryLoading,
    error: adminQueryError,
  } = useQuery<IAdmin>({
    queryKey: ["admin", address],
    queryFn: adminService.getAdmin,
    enabled: isAuthenticated && Boolean(address) && Boolean(token),
    retry: (failureCount, err) => {
      if (
        err &&
        "status" in err &&
        (err.status === 401 || err.status === 403)
      ) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = Boolean(adminData?.data?.data?.address);
  const isSuperAdmin = Boolean(adminData?.data?.data?.superAdmin);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    queryClient.removeQueries({ queryKey: ["admin"] });
    setToken(null);
    setError(null);
    HttpService.setToken("");
  }, [queryClient]);

  const disconnect = useCallback(() => {
    clearAuthData();
    wagmiDisconnect();
    // Clear any pending retry timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [clearAuthData, wagmiDisconnect]);

  // Sign-in flow: when wallet connects and we don't have a token, request nonce → sign → verify
  useEffect(() => {
    console.log("Auth effect triggered:", {
      status,
      isConnected,
      address,
      chainId,
      requiredChainId: REQUIRED_CHAIN_ID,
      isWrongNetwork,
      hasToken: !!token,
      signingInProgress: signingRef.current,
      connector: connector?.name,
    });

    // Clear any pending retry timeouts when dependencies change
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (status === "connecting" || status === "reconnecting") {
      setIsLoading(true);
      return;
    }

    // Only proceed when wallet is connected
    if (!isConnected || !address) {
      if (token) {
        console.log("Wallet disconnected, clearing auth data");
        clearAuthData();
      }
      setIsLoading(false);
      return;
    }

    // Check if user is on the wrong network
    if (isWrongNetwork) {
      console.log(
        `Wrong network detected. Current: ${chainId}, Required: ${REQUIRED_CHAIN_ID} (${REQUIRED_CHAIN.name})`,
      );
      setError(`Please switch to ${REQUIRED_CHAIN.name} network`);
      setIsLoading(false);

      // Attempt to switch network automatically
      if (switchChain) {
        console.log("Attempting to switch network automatically...");
        try {
          switchChain({ chainId: REQUIRED_CHAIN_ID });
        } catch (err) {
          console.error("Failed to switch network:", err);
        }
      }
      return;
    }

    // Already have a valid token for this address
    if (token) {
      console.log("Token already exists, skipping auth");
      HttpService.setToken(token);
      setIsLoading(false);
      return;
    }

    // Prevent concurrent signing attempts
    if (signingRef.current) {
      console.log("Signing already in progress, skipping");
      return;
    }

    console.log("Starting authentication flow for address:", address);

    const authenticate = async () => {
      signingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        // Wait for connection to fully stabilize
        // This is crucial for mobile wallet connections (MetaMask mobile, Trust Wallet, etc.)
        console.log("Waiting for wallet connection to stabilize...");
        await new Promise((resolve) => setTimeout(resolve, 800));

        console.log("Step 1: Getting nonce from backend");
        // Step 1: Get nonce from backend
        const { message } = await authService.getNonce(address);
        console.log("Nonce received, requesting signature");

        // Step 2: Ask the user to sign the message via their wallet
        const signature = await signMessageAsync({ message, account: address });
        console.log("Signature received, verifying with backend");

        // Step 3: Send signature to backend, receive JWT
        const { token: jwt } = await authService.verify(
          address,
          signature,
          message,
        );

        console.log("JWT received, storing token");
        // Store and apply
        localStorage.setItem(TOKEN_KEY, jwt);
        setToken(jwt);
        HttpService.setToken(jwt);
        console.log("Authentication successful");
      } catch (err: any) {
        console.error("Auth failed:", err);
        const errName = err?.name ?? "";
        const errMsg = err?.message ?? "";

        // Connector not ready yet (WalletConnect still establishing session) — retry after delay
        if (
          errName === "ConnectorNotConnectedError" ||
          errMsg.includes("Connector not connected") ||
          errMsg.includes("connector is not connected")
        ) {
          console.log("Connector not ready, retrying in 2 seconds...");
          signingRef.current = false;
          setIsLoading(true);

          // Retry after a delay
          retryTimeoutRef.current = setTimeout(() => {
            if (isConnected && address && !token && !signingRef.current) {
              console.log("Retrying authentication...");
              // Force re-trigger by resetting the signing ref
              signingRef.current = false;
              // The effect will re-run due to the state change
              setError(null);
            }
          }, 2000);
          return;
        }

        // User rejected the signature request — disconnect cleanly
        if (
          err?.code === 4001 ||
          err?.code === "ACTION_REJECTED" ||
          errMsg.includes("User rejected") ||
          errMsg.includes("user rejected") ||
          errMsg.includes("User denied")
        ) {
          console.log("User rejected signature");
          setError("Signature rejected");
          wagmiDisconnect();
        } else {
          console.log("Authentication error:", errMsg);
          setError(errMsg || "Authentication failed");
        }
      } finally {
        signingRef.current = false;
        setIsLoading(false);
      }
    };

    authenticate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, token, status, chainId]);

  // Clear token when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      clearAuthData();
    }
  }, [isConnected, clearAuthData]);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const overallLoading =
    status === "connecting" ||
    status === "reconnecting" ||
    isLoading ||
    (isAuthenticated && adminQueryLoading);

  useEffect(() => {
    if (adminQueryError) {
      setError("Failed to verify admin permissions");
    }
  }, [adminQueryError]);

  return (
    <AdminContext.Provider
      value={{
        token,
        isAuthenticated,
        clearAuthData,
        isAdmin,
        isSuperAdmin,
        isLoading: overallLoading,
        error,
        address: address ?? null,
        disconnect,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export { AdminProvider, AdminContext };
