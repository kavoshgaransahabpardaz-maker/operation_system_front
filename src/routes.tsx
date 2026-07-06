import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { LandingPage } from '@/features/landing/LandingPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { DocumentListPage } from '@/features/documents/DocumentListPage';
import { DocumentDetailPage } from '@/features/documents/DocumentDetailPage';
import { ShipmentListPage } from '@/features/shipments/ShipmentListPage';
import { ShipmentDetailPage } from '@/features/shipments/ShipmentDetailPage';
import { EmailConnectionsPage } from '@/features/email/EmailConnectionsPage';
import { UserManagementPage } from '@/features/settings/UserManagementPage';
import { OrgSettingsPage } from '@/features/settings/OrgSettingsPage';
import { IntelFeedPage } from '@/features/intel/IntelFeedPage';
import { IntelSearchPage } from '@/features/intel/IntelSearchPage';
import { IntelArticlePage } from '@/features/intel/IntelArticlePage';
import { IntelAlertsPage } from '@/features/intel/IntelAlertsPage';
import { IntelSourcesPage } from '@/features/intel/IntelSourcesPage';
import { IntelInterestsPage } from '@/features/intel/IntelInterestsPage';
import { IntelAnalyticsPage } from '@/features/intel/IntelAnalyticsPage';
import { IntelKnowledgeGraphPage } from '@/features/intel/IntelKnowledgeGraphPage';
import { IntelNotificationsPage } from '@/features/intel/IntelNotificationsPage';
import { IntelJobsPage } from '@/features/intel/IntelJobsPage';

export const router = createBrowserRouter([
  // Landing
  { path: '/', element: <LandingPage /> },

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
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/documents', element: <DocumentListPage /> },
          { path: '/documents/:id', element: <DocumentDetailPage /> },
          { path: '/shipments', element: <ShipmentListPage /> },
          { path: '/shipments/:id', element: <ShipmentDetailPage /> },
          { path: '/email', element: <EmailConnectionsPage /> },
          { path: '/settings/users', element: <UserManagementPage /> },
          { path: '/settings/org', element: <OrgSettingsPage /> },
          // Trade Intelligence
          { path: '/intel', element: <IntelFeedPage /> },
          { path: '/intel/search', element: <IntelSearchPage /> },
          { path: '/intel/articles/:id', element: <IntelArticlePage /> },
          { path: '/intel/alerts', element: <IntelAlertsPage /> },
          { path: '/intel/interests', element: <IntelInterestsPage /> },
          { path: '/intel/analytics', element: <IntelAnalyticsPage /> },
          { path: '/intel/knowledge-graph', element: <IntelKnowledgeGraphPage /> },
          { path: '/intel/notifications', element: <IntelNotificationsPage /> },
          { path: '/intel/sources', element: <IntelSourcesPage /> },
          { path: '/intel/jobs', element: <IntelJobsPage /> },
        ],
      },
    ],
  },
]);
