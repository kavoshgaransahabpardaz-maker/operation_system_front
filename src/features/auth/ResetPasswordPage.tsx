import { Navigate } from 'react-router-dom';

// Password reset is not supported — authentication is Google-only.
export function ResetPasswordPage() {
  return <Navigate to="/login" replace />;
}
