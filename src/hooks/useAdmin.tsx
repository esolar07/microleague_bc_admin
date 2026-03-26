import { AdminContext } from '@/context/AdminContext';
import { useContext } from 'react';

export const useAdmin = () => {
  const context = useContext(AdminContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
