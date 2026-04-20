import axios, { AxiosError, CancelTokenStatic, CancelTokenSource } from "axios";
const baseURL = "https://microleague-be-staging.vercel.app/api/v1";
// import.meta.env.VITE_API_URL || "http://localhost:8080";

// Flag to ensure interceptors are only added once
let interceptorsInitialized = false;

export class HttpService {
  CancelToken: CancelTokenStatic;
  source: CancelTokenSource;

  constructor() {
    this.CancelToken = axios.CancelToken;
    this.source = this.CancelToken.source();

    // Only add interceptors once, not for every service instance
    if (!interceptorsInitialized) {
      interceptorsInitialized = true;

      // Add a request interceptor to always include Bearer token
      axios.interceptors.request.use(
        (config) => {
          const TOKEN_KEY = "mlc_admin_jwt";
          const token = localStorage.getItem(TOKEN_KEY);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error),
      );

      // Add a response interceptor
      axios.interceptors.response.use(
        (response) => response, // Pass through successful responses
        (error: AxiosError) => {
          if (error.response && error.response.status === 401) {
            // User is unauthorized, trigger logout
            HttpService.handleLogout();
          }
          return Promise.reject(error); // Handle other errors normally
        },
      );
    }
  }

  /**
   * Set Token On Header
   * @param token
   */
  static setToken(token: string): void {
    axios.defaults.headers["Authorization"] = `Bearer ${token}`;
  }

  /**
   * Fetch data from server
   * @param url Endpoint link
   * @param params Optional query parameters
   * @return Promise
   */
  protected get = (url: string, params?: any): Promise<any> =>
    axios.get(`${baseURL}/${url}`, {
      params,
      cancelToken: this.source.token,
    });

  /**
   * Write data to server
   * @param url Endpoint link
   * @param body Data to send over server
   * @return Promise
   */
  protected post = (url: string, body: any, options = {}): Promise<any> =>
    axios.post(`${baseURL}/${url}`, body, {
      ...options,
      cancelToken: this.source.token,
    });

  /**
   * Delete data from server
   * @param url Endpoint link
   * @param params Optional query parameters
   * @param data Optional body data
   * @return Promise
   */
  protected delete = (url: string, params?: any, data?: any): Promise<any> =>
    axios.delete(`${baseURL}/${url}`, { params, data });

  /**
   * Update data on server via PUT
   * @param url Endpoint link
   * @param body Optional body data
   * @param params Optional query parameters
   * @return Promise
   */
  protected put = (url: string, body?: any, params?: any): Promise<any> => {
    return axios.put(`${baseURL}/${url}`, body, {
      ...params,
    });
  };

  /**
   * Partially update data on server via PATCH
   * @param url Endpoint link
   * @param body Optional body data
   * @param params Optional query parameters
   * @return Promise
   */
  protected patch = (url: string, body?: any, params?: any): Promise<any> => {
    return axios.patch(`${baseURL}/${url}`, body, {
      ...params,
    });
  };

  /**
   * Cancel ongoing HTTP requests
   */
  public updateCancelToken() {
    this.source = this.CancelToken.source();
  }

  cancel = () => {
    this.source.cancel("Explicitly cancelled HTTP request");
    this.updateCancelToken();
  };

  /**
   * Logout the user when unauthorized (static to be called from interceptor)
   */
  private static handleLogout(): void {
    // Clear the token from localStorage/sessionStorage
    localStorage.removeItem("access_token");

    // Remove token from cookies
    HttpService.removeCookieStatic("access_token");

    // Redirect to login or home page (adjust as per your routing logic)
    // window.location.href = '/login';
  }

  /**
   * Helper function to remove a cookie by name
   * @param name Name of the cookie to remove
   */
  private static removeCookieStatic(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}
