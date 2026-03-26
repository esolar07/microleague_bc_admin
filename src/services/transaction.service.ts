// services/transaction.service.ts
import { HttpService } from "@/services/base.service";
import { 
  TransactionsQueryDto,
  TransactionsResponseDto,
  TransactionStatsDto,
  TransactionDto
} from "@/types/transaction.interface";

class TransactionService extends HttpService {
  private readonly prefix: string = "transactions";

  /**
   * Get all transactions with filtering and pagination
   */
  getAllTransactions = (params?: TransactionsQueryDto): Promise<TransactionsResponseDto> => {
    return this.get(this.prefix, params);
  };

  /**
   * Get transaction by hash
   */
  getTransactionByHash = (txHash: string): Promise<{ data: TransactionDto }> => {
    return this.get(`${this.prefix}/${txHash}`);
  };

  /**
   * Get transactions by wallet address
   */
  getTransactionsByAddress = (address: string, params?: Partial<TransactionsQueryDto>): Promise<TransactionsResponseDto> => {
    const queryParams = { ...params, address };
    return this.get(this.prefix, queryParams);
  };

  /**
   * Get transaction statistics
   */
  getTransactionStats = (): Promise<{ data: TransactionStatsDto }> => {
    return this.get(`${this.prefix}/stats/summary`);
  };

  /**
   * Get user total tokens
   */
  getUserTokens = (params: { identifier: string }): Promise<{ identifier: string; totalTokens: number }> => {
    return this.get(`${this.prefix}/user/tokens`, params);
  };
}

export const transactionService = new TransactionService();