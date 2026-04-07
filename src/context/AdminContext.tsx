import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { HttpService } from "@/services/base.service";
import { authService } from "@/services/auth.service";
import { IAdmin } from "@/types/admin.interface";
import { adminService } from "@/services/admin.service";

const TOKEN_KEY = "mlc_admin_jwt";

interface AuthContextProps {
  token: string | null;
  isAuthenticated: boolean;
  clearAuthData: () => void;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  address: string | null;
  disconnect: () => void;
}

const AdminContext = createContext<AuthContextProps | undefined>(undefined);

const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const signingRef = useRef(false);
  const queryClient = useQueryClient();
  const { address, isConnected, status } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const isAuthenticated = isConnected && Boolean(address) && Boolean(token);

  const {
    data: adminData,
    isLoading: adminQueryLoading,
    error: adminQueryError,
  } = useQuery<IAdmin>({
    queryKey: ["admin", address],
    queryFn: adminService.getAdmin,
    enabled: isAuthenticated && Boolean(address) && Boolean(token),
    retry: (failureCount, err) => {
      if (err && "status" in err && (err.status === 401 || err.status === 403)) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = Boolean(adminData?.data?.data?.address);

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
  }, [clearAuthData, wagmiDisconnect]);

  // Restore JWT from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      HttpService.setToken(stored);
    }
  }, []);

  // Sign-in flow: when wallet connects and we don't have a token, request nonce → sign → verify
  useEffect(() => {
    if (status === "connecting" || status === "reconnecting") {
      setIsLoading(true);
      return;
    }

    if (!isConnected || !address) {
      clearAuthData();
      setIsLoading(false);
      return;
    }

    // Already have a valid token for this address
    if (token) {
      HttpService.setToken(token);
      setIsLoading(false);
      return;
    }

    // Prevent concurrent signing attempts
    if (signingRef.current) return;

    const authenticate = async () => {
      signingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Get nonce from backend
        const { message } = await authService.getNonce(address);

        // Step 2: Ask the user to sign the message via their wallet
        const signature = await signMessageAsync({ message, account: address });

        // Step 3: Send signature to backend, receive JWT
        const { token: jwt } = await authService.verify(address, signature, message);

        // Store and apply
        localStorage.setItem(TOKEN_KEY, jwt);
        setToken(jwt);
        HttpService.setToken(jwt);
      } catch (err: any) {
        console.error("Auth failed:", err);
        // If user rejected the signature, disconnect the wallet
        if (err?.code === 4001 || err?.message?.includes("User rejected")) {
          setError("Signature rejected");
          wagmiDisconnect();
        } else {
          setError(err?.message || "Authentication failed");
        }
      } finally {
        signingRef.current = false;
        setIsLoading(false);
      }
    };

    authenticate();
  }, [isConnected, address, status, token, signMessageAsync, clearAuthData, wagmiDisconnect]);

  // Clear token when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      clearAuthData();
    }
  }, [isConnected, clearAuthData]);

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
