import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Spinner } from '@/components/shared/Spinner';

export function SuperAdminGuard() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) return <Spinner size="lg" className="mt-20" />;
  if (user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
