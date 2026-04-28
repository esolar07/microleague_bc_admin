import { IAdmin, IAdminListItem } from "@/types/admin.interface";
import { HttpService } from "./base.service";

export interface CreateAdminPayload {
  firstName: string;
  lastName: string;
  address: string;
  superAdmin?: boolean;
}

class AdminService extends HttpService {
  private readonly prefix: string = "admin";

  getAdmin = async (): Promise<IAdmin> => {
    const response = await this.get(`${this.prefix}/me`);
    return response as IAdmin;
  };

  getAllAdmins = async (): Promise<IAdminListItem[]> => {
    const response = await this.get(`${this.prefix}`);
    return (response.data?.data ?? response.data) as IAdminListItem[];
  };

  createAdmin = async (data: CreateAdminPayload): Promise<IAdminListItem> => {
    const response = await this.post(`${this.prefix}`, data);
    return (response.data?.data ?? response.data) as IAdminListItem;
  };

  deleteAdmin = async (id: string): Promise<void> => {
    await this.delete(`${this.prefix}/${id}`);
  };
}
export const adminService = new AdminService();
