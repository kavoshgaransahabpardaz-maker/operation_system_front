import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { DocumentListPage } from '@/features/documents/DocumentListPage';
import { DocumentDetailPage } from '@/features/documents/DocumentDetailPage';
import { ShipmentListPage } from '@/features/shipments/ShipmentListPage';
import { ShipmentDetailPage } from '@/features/shipments/ShipmentDetailPage';
import { EmailConnectionsPage } from '@/features/email/EmailConnectionsPage';
import { UserManagementPage } from '@/features/settings/UserManagementPage';

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // Authenticated routes
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/documents', element: <DocumentListPage /> },
          { path: '/documents/:id', element: <DocumentDetailPage /> },
          { path: '/shipments', element: <ShipmentListPage /> },
          { path: '/shipments/:id', element: <ShipmentDetailPage /> },
          { path: '/email', element: <EmailConnectionsPage /> },
          { path: '/settings/users', element: <UserManagementPage /> },
        ],
      },
    ],
  },
]);
