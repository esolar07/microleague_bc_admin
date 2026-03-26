// hooks/transaction.hooks.ts
import { useQuery } from "@tanstack/react-query";
import { TransactionsQueryDto } from "@/types/transaction.interface";
import { transactionService } from "@/services/transaction.service";

// Query keys
export const transactionKeys = {
  all: ["transactions"] as const,
  lists: () => [...transactionKeys.all, "list"] as const,
  stats: () => [...transactionKeys.all, "stats"] as const,
  list: (filters: TransactionsQueryDto) =>
    [...transactionKeys.lists(), filters] as const,
  byAddress: (address: string, filters?: Partial<TransactionsQueryDto>) =>
    [...transactionKeys.all, "address", address, filters] as const,
};

export const useTransactions = (filters: TransactionsQueryDto = {}) => {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => transactionService.getAllTransactions(filters),
    staleTime: 5 * 60 * 1000,
    // keepPreviousData: true,
  });
};

export const useTransactionStats = () => {
  return useQuery({
    queryKey: transactionKeys.stats(),
    queryFn: () => transactionService.getTransactionStats(),
    staleTime: 2 * 60 * 1000,
  });
};

export const useTransactionsByAddress = (address: string, filters: Partial<TransactionsQueryDto> = {}) => {
  return useQuery({
    queryKey: transactionKeys.byAddress(address, filters),
    queryFn: () => transactionService.getTransactionsByAddress(address, filters),
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
  });
};