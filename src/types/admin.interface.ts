export interface IAdmin {
  data: {
    data: { firstName?: string; lastName?: string; address: string };
    message: string;
    statusCode: number;
  };
}
