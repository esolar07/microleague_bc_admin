export enum PrivateSaleSubmissionStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  ALL = "All",
}

export interface PrivateSaleSubmission {
  id: string;
  submissionId: string;
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
  proofFileName?: string;
  notes?: string;
  status: PrivateSaleSubmissionStatus;
  verificationNote?: string;
  allocationTxHash?: string;
  allocatedTokens?: string;
  allocatedStageId?: number;
  verifiedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrivateSaleSubmissionFilters {
  search?: string;
  status?: PrivateSaleSubmissionStatus | "All";
  page?: number;
  limit?: number;
  sort?: string;
}

export interface VerifyPrivateSaleSubmissionData {
  status: PrivateSaleSubmissionStatus.APPROVED | PrivateSaleSubmissionStatus.REJECTED;
  verificationNote?: string;
  transactionHash?: string;
  allocatedTokens?: string;
  allocatedStageId?: string;
}

export interface PrivateSaleSubmissionStats {
  pending: number;
  approved: number;
  rejected: number;
  totalAmount: number;
}

export interface PrivateSaleSubmissionListResponse {
  statusCode: number;
  message: string;
  data: {
    data: {
      data: PrivateSaleSubmission[];
      pagination: {
        totalCount: number;
        totalPages: number;
        page: number;
        limit: number;
      };
      stats: PrivateSaleSubmissionStats;
    };
  };
}
