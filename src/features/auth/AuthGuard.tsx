import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { session } from '@/lib/session';

export function AuthGuard() {
  const location = useLocation();
  if (!session.hasToken()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
