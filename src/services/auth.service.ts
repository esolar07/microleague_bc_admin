import { HttpService } from "./base.service";

class AuthServiceClass extends HttpService {
  private readonly prefix = "auth";

  /** Request a nonce + message for the wallet to sign. */
  getNonce = async (walletAddress: string): Promise<{ nonce: string; message: string }> => {
    const response = await this.post(`${this.prefix}/nonce`, { walletAddress });
    // Backend wraps responses in { statusCode, message, data }
    return response.data?.data ?? response.data;
  };

  /** Send the signed message to the backend and receive a JWT. */
  verify = async (
    walletAddress: string,
    signature: string,
    message: string,
  ): Promise<{ token: string; address: string }> => {
    const response = await this.post(`${this.prefix}/verify`, {
      walletAddress,
      signature,
      message,
    });
    return response.data?.data ?? response.data;
  };
}

export const authService = new AuthServiceClass();
