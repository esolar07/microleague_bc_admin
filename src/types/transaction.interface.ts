// types/transaction.interface.ts
export enum PresaleTxType {
  BLOCKCHAIN = "blockchain",
  WERT = "wert",
  Crypto_Payment = "Crypto Payment",
  Bank_Transfer = "Bank Transfer",
  Other_Cryptos = "Other Cryptos",
  Card_Payment = "Card Payment",
}

export interface Transaction {
  _id?: string;
  txHash: string;
  contract: string;
  address: string;
  email?: string;
  tokenAddress: string;
  type: PresaleTxType;
  amount: number;
  stage: number;
  tokens: number;
  timestamp: number;
  usdAmount: number;
  quote: string;
  typeformId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionFilters {
  limit?: number;
  page?: number;
  address?: string;
  contract?: string;
  tokenAddress?: string;
  type?: PresaleTxType;
  stage?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DailyTransaction {
  date: string;
  count: number;
  volume: number;
}

export interface TransactionStats {
  totalTransactions: number;
  totalTokensSold: number;
  totalAmount: number;
  totalUsdAmount: number;
  averageTransactionSize: number;
  largestTransaction: number;
  transactionsByType: Record<string, number>;
  transactionsByStage: Record<number, number>;
  dailyTransactions: DailyTransaction[];
}

// DTOs for API responses
export interface TransactionsResponseDto {
  data: {
    data: {
      data: Transaction[];
    };
  };
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionDto {
  txHash: string;
  contract: string;
  address: string;
  email?: string;
  tokenAddress: string;
  type: PresaleTxType;
  amount: number;
  stage: number;
  tokens: number;
  timestamp: number;
  usdAmount: number;
  quote: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionStatsDto {
  data: {
    totalTransactions: number;
    totalTokensSold: number;
    totalAmount: number;
    totalUsdAmount: number;
    averageTransactionSize: number;
    largestTransaction: number;
    transactionsByType: Record<string, number>;
    transactionsByStage: Record<number, number>;
    dailyTransactions: DailyTransaction[];
  };
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionsQueryDto {
  limit?: number;
  page?: number;
  address?: string;
  contract?: string;
  tokenAddress?: string;
  type?: PresaleTxType;
  stage?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
