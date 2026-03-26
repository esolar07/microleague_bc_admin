import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  BankTransferStatus,
  CreateBankTransferData,
  UpdateBankTransferData,
  VerifyBankTransferData,
  BankTransferFilters 
} from "@/types/bank-transfer.interface";
import { toast } from "sonner";
import { bankTransferService } from "@/services/bankTransfer.service";

// Query keys
export const bankTransferKeys = {
  all: ["bank-transfers"] as const,
  lists: () => [...bankTransferKeys.all, "list"] as const,
  list: (filters: BankTransferFilters) => [...bankTransferKeys.lists(), filters] as const,
  details: () => [...bankTransferKeys.all, "detail"] as const,
  detail: (id: string) => [...bankTransferKeys.details(), id] as const,
  stats: () => [...bankTransferKeys.all, "stats"] as const,
};

/**
 * Hook to get all bank transfers with filtering and pagination
 */
export const useBankTransfers = (filters: BankTransferFilters = {}) => {
  return useQuery({
    queryKey: bankTransferKeys.list(filters),
    queryFn: () => bankTransferService.getAllBankTransfers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get bank transfer statistics
 */
export const useBankTransferStats = () => {
  return useQuery({
    queryKey: bankTransferKeys.stats(),
    queryFn: () => bankTransferService.getBankTransferStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get a specific bank transfer by ID
 */
export const useBankTransfer = (id: string) => {
  return useQuery({
    queryKey: bankTransferKeys.detail(id),
    queryFn: () => bankTransferService.getBankTransferById(id),
    enabled: !!id, // Only fetch if ID is provided
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to create a new bank transfer
 */
export const useCreateBankTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBankTransferData) => 
      bankTransferService.createBankTransfer(data),
    onSuccess: () => {
      // Invalidate and refetch bank transfers list and stats
      queryClient.invalidateQueries({ queryKey: bankTransferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bankTransferKeys.stats() });
      toast.success("Bank transfer submitted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit bank transfer");
    },
  });
};

/**
 * Hook to update a bank transfer
 */
export const useUpdateBankTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBankTransferData }) =>
      bankTransferService.updateBankTransfer(id, data),
    onSuccess: (response, variables) => {
      // Invalidate specific bank transfer and lists
      queryClient.invalidateQueries({ queryKey: bankTransferKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: bankTransferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bankTransferKeys.stats() });
      toast.success("Bank transfer updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update bank transfer");
    },
  });
};

/**
 * Hook to verify or reject a bank transfer
 */
export const useVerifyBankTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VerifyBankTransferData }) =>
      bankTransferService.verifyBankTransfer(id, data),
    onSuccess: (response, variables) => {
      const action = variables.data.status === BankTransferStatus.VERIFIED ? "approved" : "rejected";
      
      // Invalidate specific bank transfer and lists
      queryClient.invalidateQueries({ queryKey: bankTransferKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: bankTransferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bankTransferKeys.stats() });
      
      toast.success(`Bank transfer ${variables.id} has been ${action}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to verify bank transfer");
    },
  });
};

/**
 * Hook to delete a bank transfer
 */
export const useDeleteBankTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bankTransferService.deleteBankTransfer(id),
    onSuccess: (_, id) => {
      // Invalidate lists and stats
      queryClient.invalidateQueries({ queryKey: bankTransferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bankTransferKeys.stats() });
      toast.success("Bank transfer deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete bank transfer");
    },
  });
};