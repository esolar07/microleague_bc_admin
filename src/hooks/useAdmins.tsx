import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminService, CreateAdminPayload } from "@/services/admin.service";

export const adminKeys = {
  all: ["admins"] as const,
  list: () => [...adminKeys.all, "list"] as const,
};

export const useAllAdmins = () => {
  return useQuery({
    queryKey: adminKeys.list(),
    queryFn: adminService.getAllAdmins,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdminPayload) => adminService.createAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.list() });
      toast.success("Admin created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create admin");
    },
  });
};

export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminService.deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.list() });
      toast.success("Admin removed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to remove admin");
    },
  });
};
