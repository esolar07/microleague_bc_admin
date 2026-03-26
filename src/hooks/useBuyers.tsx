import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BuyerStatus,
  CreateBuyerData,
  UpdateBuyerData,
  BuyerFilters,
} from "@/types/buyer.interface";
import { toast } from "sonner";
import { buyerService } from "@/services/buyer.service";

interface TopBuyersParams {
  limit?: number;
}

// Query keys
export const buyerKeys = {
  all: ["buyers"] as const,
  lists: () => [...buyerKeys.all, "list"] as const,
  list: (filters: BuyerFilters) => [...buyerKeys.lists(), filters] as const,
  details: () => [...buyerKeys.all, "detail"] as const,
  detail: (id: string) => [...buyerKeys.details(), id] as const,
  wallet: (walletAddress: string) =>
    [...buyerKeys.details(), "wallet", walletAddress] as const,
  stats: () => [...buyerKeys.all, "stats"] as const,
};

/**
 * Hook to get all buyers with filtering and pagination
 */
export const useBuyers = (filters: BuyerFilters = {}) => {
  return useQuery({
    queryKey: buyerKeys.list(filters),
    queryFn: () => buyerService.getAllBuyers(filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useTopBuyers = (params: TopBuyersParams = {}) => {
  const { limit = 5 } = params;
  return useQuery({
    queryKey: ["topBuyers", limit],
    queryFn: () => buyerService.getTopBuyers(limit),
    staleTime: 30000,
  });
};

/**
 * Hook to get buyer statistics
 */
export const useBuyerStats = () => {
  return useQuery({
    queryKey: buyerKeys.stats(),
    queryFn: () => buyerService.getBuyerStats(),
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook to get a specific buyer by ID
 */
export const useBuyer = (id: string) => {
  return useQuery({
    queryKey: buyerKeys.detail(id),
    queryFn: () => buyerService.getBuyerById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to get buyer by wallet address
 */
export const useBuyerByWallet = (walletAddress: string) => {
  return useQuery({
    queryKey: buyerKeys.wallet(walletAddress),
    queryFn: () => buyerService.getBuyerByWallet(walletAddress),
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to create a new buyer
 */
export const useCreateBuyer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBuyerData) => buyerService.createBuyer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: buyerKeys.stats() });
      toast.success("Buyer created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create buyer");
    },
  });
};

/**
 * Hook to update a buyer
 */
export const useUpdateBuyer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBuyerData }) =>
      buyerService.updateBuyer(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: buyerKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: buyerKeys.stats() });
      toast.success("Buyer updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update buyer");
    },
  });
};

/**
 * Hook to update buyer by wallet address
 */
export const useUpdateBuyerByWallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      walletAddress,
      data,
    }: {
      walletAddress: string;
      data: UpdateBuyerData;
    }) => buyerService.updateBuyerByWallet(walletAddress, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: buyerKeys.wallet(variables.walletAddress),
      });
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: buyerKeys.stats() });
      toast.success("Buyer updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update buyer");
    },
  });
};

/**
 * Hook to delete a buyer
 */
export const useDeleteBuyer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => buyerService.deleteBuyer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: buyerKeys.stats() });
      toast.success("Buyer deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete buyer");
    },
  });
};

/**
 * Hook to update last activity
 */
export const useUpdateLastActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (walletAddress: string) =>
      buyerService.updateLastActivity(walletAddress),
    onSuccess: (response, walletAddress) => {
      queryClient.invalidateQueries({
        queryKey: buyerKeys.wallet(walletAddress),
      });
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
    },
    onError: (error: any) => {
      console.error("Failed to update last activity:", error);
    },
  });
};

/**
 * Hook to increment referrals
 */
export const useIncrementReferrals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (walletAddress: string) =>
      buyerService.incrementReferrals(walletAddress),
    onSuccess: (response, walletAddress) => {
      queryClient.invalidateQueries({
        queryKey: buyerKeys.wallet(walletAddress),
      });
      queryClient.invalidateQueries({ queryKey: buyerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: buyerKeys.stats() });
      toast.success("Referral incremented successfully!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to increment referrals"
      );
    },
  });
};
