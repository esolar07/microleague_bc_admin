import { IAdmin } from "@/types/admin.interface";
import { HttpService } from "./base.service";

class AdminService extends HttpService {
  private readonly prefix: string = "admin";

  /**
   * Sign in
   * @param data
   */
  getAdmin = async (): Promise<IAdmin> => {
    const response = await this.get(`${this.prefix}/me`);
    return response as IAdmin;
  };
}
export const adminService = new AdminService();
