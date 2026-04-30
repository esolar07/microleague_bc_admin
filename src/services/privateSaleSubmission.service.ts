import { HttpService } from "@/services/base.service";
import {
  PrivateSaleSubmissionListResponse,
  PrivateSaleSubmissionStatus,
  VerifyPrivateSaleSubmissionData,
} from "@/types/private-sale-submission.interface";

export interface CreatePrivateSaleSubmissionData {
  fullName: string;
  email: string;
  contact: string;
  country: string;
  walletAddress: string;
  amount: number;
  paymentMethod: string;
  transactionRef: string;
  paymentReference?: string;
  proofUrl: string;
  notes?: string;
}

class PrivateSaleSubmissionService extends HttpService {
  private readonly prefix = "private-sale-submissions";

  getAll = (params?: {
    search?: string;
    status?: PrivateSaleSubmissionStatus | "All";
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<PrivateSaleSubmissionListResponse> => this.get(this.prefix, params);

  getStats = (): Promise<any> => this.get(`${this.prefix}/stats`);

  create = (data: CreatePrivateSaleSubmissionData): Promise<any> =>
    this.post(this.prefix, data);

  verify = (id: string, data: VerifyPrivateSaleSubmissionData) =>
    this.post(`${this.prefix}/${id}/verify`, data);
}

export const privateSaleSubmissionService = new PrivateSaleSubmissionService();
