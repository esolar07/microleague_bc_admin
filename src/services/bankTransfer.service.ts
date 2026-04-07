import { HttpService } from "@/services/base.service";
import { 
  BankTransfer, 
  BankTransferStatus,
  CreateBankTransferData,
  UpdateBankTransferData,
  VerifyBankTransferData,
  BankTransferListResponse,
  BankTransferStats 
} from "@/types/bank-transfer.interface";

class BankTransferService extends HttpService {
  private readonly prefix: string = "bank-transfers";

  /**
   * Submit a new bank transfer for verification
   * @param data Bank transfer data
   */
  createBankTransfer = (data: CreateBankTransferData): Promise<{ data: BankTransfer }> => {
    return this.post(this.prefix, data);
  };

  /**
   * Get all bank transfers with filtering and pagination
   * @param params Filter and pagination parameters
   */
  getAllBankTransfers = (params?: {
    search?: string;
    status?: BankTransferStatus | "All";
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<BankTransferListResponse> => {
    return this.get(this.prefix, params);
  };

  /**
   * Get bank transfer statistics
   */
  getBankTransferStats = (): Promise<{ data: BankTransferStats }> => {
    return this.get(`${this.prefix}/stats`);
  };

  /**
   * Get a specific bank transfer by ID
   * @param id Bank transfer ID (e.g., "BT-2025-001")
   */
  getBankTransferById = (id: string): Promise<{ data: BankTransfer }> => {
    return this.get(`${this.prefix}/${id}`);
  };

  /**
   * Update a bank transfer
   * @param id Bank transfer ID
   * @param data Update data
   */
  updateBankTransfer = (id: string, data: UpdateBankTransferData): Promise<{ data: BankTransfer }> => {
    return this.patch(`${this.prefix}/${id}`, data);
  };

  /**
   * Verify or reject a bank transfer
   * @param id Bank transfer ID
   * @param data Verification data
   */
  verifyBankTransfer = (id: string, data: VerifyBankTransferData): Promise<{ data: BankTransfer }> => {
    return this.post(`${this.prefix}/${id}/verify`, data);
  };

  /**
   * Delete a bank transfer
   * @param id Bank transfer ID
   */
  deleteBankTransfer = (id: string): Promise<void> => {
    return this.delete(`${this.prefix}/${id}`);
  };
}

export const bankTransferService = new BankTransferService();