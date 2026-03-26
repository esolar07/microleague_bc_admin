import { HttpService } from "@/services/base.service";
import { 
  Buyer, 
  CreateBuyerData,
  UpdateBuyerData,
  BuyerListResponse,
  BuyerFilters, 
  BuyerStatsResponse
} from "@/types/buyer.interface";

class BuyerService extends HttpService {
  private readonly prefix: string = "user";

  /**
   * Create a new buyer
   */
  createBuyer = (data: CreateBuyerData): Promise<{ data: Buyer }> => {
    return this.post(this.prefix, data);
  };

  /**
   * Get all buyers with filtering and pagination
   */
  getAllBuyers = (params?: BuyerFilters): Promise<BuyerListResponse> => {
    // Convert "All" status to undefined so backend ignores it
    const backendParams = { ...params };
    if (backendParams.status === "All") {
      delete backendParams.status;
    }
    
    return this.get(this.prefix, backendParams);
  };

  /**
   * Get buyer statistics
   */
  getBuyerStats = (): Promise<BuyerStatsResponse> => {
    return this.get(`${this.prefix}/stats`);
  };

  /**
   * Get buyer statistics
   */
  getTopBuyers = (params?:any): Promise<BuyerListResponse> => {
    return this.get(`${this.prefix}/top?limit=${params}`);
  };

  /**
   * Get a specific buyer by ID
   */
  getBuyerById = (id: string): Promise<{ data: Buyer }> => {
    return this.get(`${this.prefix}/${id}`);
  };

  /**
   * Get buyer by wallet address
   */
  getBuyerByWallet = (walletAddress: string): Promise<{ data: Buyer }> => {
    return this.get(`${this.prefix}/wallet/${walletAddress}`);
  };

  /**
   * Update a buyer
   */
  updateBuyer = (id: string, data: UpdateBuyerData): Promise<{ data: Buyer }> => {
    return this.patch(`${this.prefix}/${id}`, data);
  };

  /**
   * Update buyer by wallet address
   */
  updateBuyerByWallet = (walletAddress: string, data: UpdateBuyerData): Promise<{ data: Buyer }> => {
    return this.patch(`${this.prefix}/wallet/${walletAddress}`, data);
  };

  /**
   * Delete a buyer
   */
  deleteBuyer = (id: string): Promise<void> => {
    return this.delete(`${this.prefix}/${id}`);
  };

  /**
   * Update last activity
   */
  updateLastActivity = (walletAddress: string): Promise<{ data: Buyer }> => {
    return this.patch(`${this.prefix}/activity/${walletAddress}`);
  };

  /**
   * Increment referrals
   */
  incrementReferrals = (walletAddress: string): Promise<{ data: Buyer }> => {
    return this.patch(`${this.prefix}/referrals/${walletAddress}/increment`);
  };
}

export const buyerService = new BuyerService();