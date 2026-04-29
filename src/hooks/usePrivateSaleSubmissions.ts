import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { privateSaleSubmissionService } from "@/services/privateSaleSubmission.service";
import {
  PrivateSaleSubmissionFilters,
  PrivateSaleSubmissionStatus,
  VerifyPrivateSaleSubmissionData,
} from "@/types/private-sale-submission.interface";

export const privateSaleSubmissionKeys = {
  all: ["private-sale-submissions"] as const,
  lists: () => [...privateSaleSubmissionKeys.all, "list"] as const,
  list: (filters: PrivateSaleSubmissionFilters) => [...privateSaleSubmissionKeys.lists(), filters] as const,
  stats: () => [...privateSaleSubmissionKeys.all, "stats"] as const,
};

export const usePrivateSaleSubmissions = (filters: PrivateSaleSubmissionFilters = {}) =>
  useQuery({
    queryKey: privateSaleSubmissionKeys.list(filters),
    queryFn: () => privateSaleSubmissionService.getAll(filters),
    staleTime: 5 * 60 * 1000,
  });

export const usePrivateSaleSubmissionStats = () =>
  useQuery({
    queryKey: privateSaleSubmissionKeys.stats(),
    queryFn: () => privateSaleSubmissionService.getStats(),
    staleTime: 2 * 60 * 1000,
  });

export const useVerifyPrivateSaleSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: VerifyPrivateSaleSubmissionData;
    }) => privateSaleSubmissionService.verify(id, data),
    onSuccess: (_response, variables) => {
      const action =
        variables.data.status === PrivateSaleSubmissionStatus.APPROVED
          ? "approved"
          : "rejected";

      queryClient.invalidateQueries({ queryKey: privateSaleSubmissionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: privateSaleSubmissionKeys.stats() });
      toast.success(`Private sale submission ${action}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update private sale submission");
    },
  });
};
