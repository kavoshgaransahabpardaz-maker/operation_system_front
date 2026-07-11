import { Navigate } from 'react-router-dom';

// Password reset is not supported — authentication is Google-only.
export function ForgotPasswordPage() {
  return <Navigate to="/login" replace />;
}
