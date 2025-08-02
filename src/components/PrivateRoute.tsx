import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const PrivateRoute = ({ children, adminOnly = false }: PrivateRouteProps) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    // Redireciona para o login se não estiver autenticado
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    // Redireciona para atendimentos se não for admin
    return <Navigate to="/atendimentos" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;