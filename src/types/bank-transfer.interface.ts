export enum BankTransferStatus {
  PENDING = "Pending",
  VERIFIED = "Verified",
  REJECTED = "Rejected",
  ALL = "All",
}

export interface BankTransfer {
  id: string;
  walletAddress: string;
  amount: number;
  senderName: string;
  bankName: string;
  transactionRef: string;
  paymentRef: string;
  submittedDate: string;
  status: BankTransferStatus;
  proofUrl: string;
  notes?: string;
  verificationNote?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankTransferData {
  walletAddress: string;
  amount: number;
  senderName: string;
  bankName: string;
  transactionRef: string;
  paymentRef: string;
  submittedDate: string;
  proofUrl: string;
  notes?: string;
}

export interface UpdateBankTransferData {
  walletAddress?: string;
  amount?: number;
  senderName?: string;
  bankName?: string;
  transactionRef?: string;
  paymentRef?: string;
  submittedDate?: string;
  proofUrl?: string;
  notes?: string;
  status?: BankTransferStatus;
  verificationNote?: string;
}

export interface VerifyBankTransferData {
  status: BankTransferStatus.VERIFIED | BankTransferStatus.REJECTED;
  verificationNote?: string;
  transactionHash?: string
  allocatedTokens?: string
}

export interface BankTransferStats {
  data: {
    pending: number;
    verified: number;
    rejected: number;
    totalAmount: number;
  }
}

export interface BankTransferListResponse {
  statusCode: number;
  message: string;
  data: {
    data: {
      data: BankTransfer[];
      pagination: {
        totalCount: number;
        totalPages: number;
        page: number;
        limit: number;
      };
      stats: BankTransferStats;
    };
  };
}

export interface BankTransferFilters {
  search?: string;
  status?: BankTransferStatus | "All";
  page?: number;
  limit?: number;
  sort?: string;
}
