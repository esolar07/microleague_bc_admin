import React, { createContext, useState, useEffect, useCallback } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { HttpService } from "@/services/base.service";
import {
  useDynamicContext,
  useIsLoggedIn,
  getAuthToken,
} from "@dynamic-labs/sdk-react-core";
import { IAdmin } from "@/types/admin.interface";
import { adminService } from "@/services/admin.service";

interface AuthContextProps {
  token: string | null;
  isAuthenticated: boolean;
  clearAuthData: () => void;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  address: string | null;
}

const AdminContext = createContext<AuthContextProps | undefined>(undefined);

const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { primaryWallet, sdkHasLoaded, user } = useDynamicContext();
  const isLoggedIn = useIsLoggedIn();

  const address = user?.verifiedCredentials?.[0]?.address;

  const isAuthenticated = Boolean(
    isLoggedIn && primaryWallet?.address && sdkHasLoaded
  );

  const {
    data: adminData,
    isLoading: adminQueryLoading,
    error: adminQueryError,
  } = useQuery<IAdmin>({
    queryKey: ["admin", primaryWallet?.address],
    queryFn: adminService.getAdmin,
    enabled:
      isAuthenticated && Boolean(primaryWallet?.address) && Boolean(token),
    retry: (failureCount, error) => {
      // Don't retry if it's a 401/403 error (unauthorized)
      if (
        error &&
        "status" in error &&
        (error.status === 401 || error.status === 403)
      ) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isAdmin = Boolean(adminData?.data?.data?.address);

  // Clear authentication data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem("dynamic_authentication_token");
    Cookies.remove("dynamic_authentication_token");
    queryClient.removeQueries({ queryKey: ["admin"] });
    setToken(null);
    setError(null);
    HttpService.setToken("");
  }, [queryClient]);

  // Handle authentication token management
  useEffect(() => {
    if (!sdkHasLoaded) {
      setIsLoading(true);
      return;
    }

    if (isAuthenticated) {
      try {
        // Use Dynamic's getAuthToken utility
        const authToken = getAuthToken();

        if (authToken) {
          setToken(authToken);
          HttpService.setToken(authToken);
          setError(null);
          setIsLoading(false);
        } else {
          // Fallback to localStorage token if getAuthToken returns null
          const storedToken = localStorage.getItem(
            "dynamic_authentication_token"
          );
          const cleanedToken = storedToken?.replace(/^"|"$/g, "");

          if (cleanedToken) {
            setToken(cleanedToken);
            HttpService.setToken(cleanedToken);
            setError(null);
          } else {
            setError("No authentication token found");
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error getting auth token:", err);
        setError("Failed to retrieve authentication token");
        setIsLoading(false);
      }
    } else {
      // Not authenticated
      clearAuthData();
      setIsLoading(false);
    }
  }, [isAuthenticated, sdkHasLoaded, clearAuthData]);

  // Handle loading state
  const overallLoading =
    !sdkHasLoaded || isLoading || (isAuthenticated && adminQueryLoading);

  // Set error from admin query
  useEffect(() => {
    if (adminQueryError) {
      setError("Failed to verify admin permissions");
    }
  }, [adminQueryError]);

  console.log({
    isLoggedIn,
    isAuthenticated,
    isAdmin,
    primaryWallet: primaryWallet?.address,
    sdkHasLoaded,
    overallLoading,
    hasToken: Boolean(token),
    error,
    address,
  });

  return (
    <AdminContext.Provider
      value={{
        token,
        isAuthenticated,
        clearAuthData,
        isAdmin,
        isLoading: overallLoading,
        error,
        address,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export { AdminProvider, AdminContext };
