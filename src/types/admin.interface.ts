export interface IAdmin {
  data: {
    data: {
      id?: string;
      firstName?: string;
      lastName?: string;
      address: string;
      superAdmin?: boolean;
      createdAt?: string;
    };
    message: string;
    statusCode: number;
  };
}

export interface IAdminListItem {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  superAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}
