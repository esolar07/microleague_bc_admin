export enum BuyerStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  ALL = "All",
}

export interface Buyer {
  id: string;
  walletAddress: string;
  tokensPurchased: number;
  amountSpent: number;
  claimed: number;
  unclaimed: number;
  referrals: number;
  joinDate: string;
  lastActivity?: string;
  status: BuyerStatus;
  createdAt: string;
  updatedAt: string;
  // Profile fields
  username?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  // Reputation fields
  reputationScore?: number;
  reputationTier?: string;
  reputationUpdatedAt?: string;
}

export interface Stats {
  _id: string | null;
  totalBuyers: number;
  activeBuyers: number;
  totalVolume: number;
  totalTokensPurchased: number;
  totalClaimed: number;
  totalUnclaimed: number;
  totalReferrals: number;
  avgPurchase: number;
}

export interface CreateBuyerData {
  walletAddress: string;
  tokensPurchased: number;
  amountSpent: number;
  claimed: number;
  unclaimed: number;
  referrals: number;
  joinDate: string;
  lastActivity?: string;
  status?: BuyerStatus;
}

export interface UpdateBuyerData {
  walletAddress?: string;
  tokensPurchased?: number;
  amountSpent?: number;
  claimed?: number;
  unclaimed?: number;
  referrals?: number;
  joinDate?: string;
  lastActivity?: string;
  status?: BuyerStatus;
}

export interface BuyerStats {
  totalBuyers: number;
  activeBuyers: number;
  totalVolume: number;
  totalTokensPurchased: number;
  totalClaimed: number;
  totalUnclaimed: number;
  totalReferrals: number;
  avgPurchase: number;
}

export interface BuyerListResponse {
  statusCode: number;
  message: string;
  data: {
    data: {
      data: Buyer[];
      pagination: {
        totalCount: number;
        totalPages: number;
        page: number;
        limit: number;
      };
      stats: BuyerStats;
    };
  };
}

export interface BuyerStatsResponse {
  statusCode: number;
  message: string;
  data: {
    data: {
      data: Stats
    };
  };
}

export interface BuyerFilters {
  search?: string;
  status?: BuyerStatus | "All";
  page?: number;
  limit?: number;
  sort?: string;
}
