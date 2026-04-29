import { HttpService } from "@/services/base.service";
import {
  PrivateSaleSubmissionListResponse,
  PrivateSaleSubmissionStatus,
  VerifyPrivateSaleSubmissionData,
} from "@/types/private-sale-submission.interface";

class PrivateSaleSubmissionService extends HttpService {
  private readonly prefix = "private-sale-submissions";

  getAll = (params?: {
    search?: string;
    status?: PrivateSaleSubmissionStatus | "All";
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<PrivateSaleSubmissionListResponse> => this.get(this.prefix, params);

  getStats = (): Promise<{ data: { pending: number; approved: number; rejected: number; totalAmount: number } }> =>
    this.get(`${this.prefix}/stats`);

  verify = (id: string, data: VerifyPrivateSaleSubmissionData) =>
    this.post(`${this.prefix}/${id}/verify`, data);
}

export const privateSaleSubmissionService = new PrivateSaleSubmissionService();
