import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { AdminGuard } from '@/features/admin/AdminGuard';
import { SuperAdminGuard } from '@/features/superadmin/SuperAdminGuard';
import { SuperAdminPage } from '@/features/superadmin/SuperAdminPage';
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
import { AdminPage } from '@/features/admin/AdminPage';
import { TradeWatchFeedPage } from '@/features/intel/IntelFeedPage';
import { IntelSearchPage } from '@/features/intel/IntelSearchPage';
import { IntelArticlePage } from '@/features/intel/IntelArticlePage';
import { IntelAlertsPage } from '@/features/intel/IntelAlertsPage';
import { IntelSourcesPage } from '@/features/intel/IntelSourcesPage';
import { IntelInterestsPage } from '@/features/intel/IntelInterestsPage';
import { IntelAnalyticsPage } from '@/features/intel/IntelAnalyticsPage';
import { IntelKnowledgeGraphPage } from '@/features/intel/IntelKnowledgeGraphPage';
import { IntelNotificationsPage } from '@/features/intel/IntelNotificationsPage';
import { IntelJobsPage } from '@/features/intel/IntelJobsPage';
import { SourcesPage } from '@/features/intel/SourcesPage';
import { WorkspacePage } from '@/features/workspace/WorkspacePage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';

export const router = createBrowserRouter([
  // Landing
  { path: '/', element: <LandingPage /> },

  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // Onboarding (authenticated but outside AppShell)
  {
    element: <AuthGuard />,
    children: [
      { path: '/onboarding', element: <OnboardingPage /> },
    ],
  },

  // Authenticated routes
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },

          // Workspace (unified Documents + Shipments + Email)
          { path: '/workspace', element: <WorkspacePage /> },
          { path: '/workspace/documents/:id', element: <DocumentDetailPage /> },
          { path: '/workspace/shipments/:id', element: <ShipmentDetailPage /> },

          // Legacy standalone routes (kept for backwards compat)
          { path: '/documents', element: <DocumentListPage /> },
          { path: '/documents/:id', element: <DocumentDetailPage /> },
          { path: '/shipments', element: <ShipmentListPage /> },
          { path: '/shipments/:id', element: <ShipmentDetailPage /> },
          { path: '/email', element: <EmailConnectionsPage /> },

          { path: '/settings/notifications', element: <IntelNotificationsPage /> },
          { path: '/settings/interests', element: <IntelInterestsPage /> },
          { path: '/settings/sources', element: <SourcesPage /> },

          // Legacy admin routes → redirect to admin panel
          { path: '/settings/users', element: <Navigate to="/admin?tab=users" replace /> },
          { path: '/settings/org', element: <Navigate to="/admin?tab=org" replace /> },
          { path: '/intel/jobs', element: <Navigate to="/admin?tab=jobs" replace /> },
          { path: '/intel/sources', element: <Navigate to="/admin?tab=sources" replace /> },

          // Admin panel (nested AdminGuard inside AppShell)
          {
            element: <AdminGuard />,
            children: [
              { path: '/admin', element: <AdminPage /> },
            ],
          },

          // Super Admin panel
          {
            element: <SuperAdminGuard />,
            children: [
              { path: '/superadmin', element: <SuperAdminPage /> },
            ],
          },

          // TradeWatch (new paths)
          { path: '/tradewatch', element: <TradeWatchFeedPage /> },
          { path: '/tradewatch/search', element: <IntelSearchPage /> },
          { path: '/tradewatch/articles/:id', element: <IntelArticlePage /> },
          { path: '/tradewatch/analytics', element: <IntelAnalyticsPage /> },
          { path: '/tradewatch/knowledge-graph', element: <IntelKnowledgeGraphPage /> },

          // Legacy /intel/* routes (backwards compat)
          { path: '/intel', element: <TradeWatchFeedPage /> },
          { path: '/intel/search', element: <IntelSearchPage /> },
          { path: '/intel/articles/:id', element: <IntelArticlePage /> },
          { path: '/intel/alerts', element: <IntelAlertsPage /> },
          { path: '/intel/interests', element: <IntelInterestsPage /> },
          { path: '/intel/analytics', element: <IntelAnalyticsPage /> },
          { path: '/intel/knowledge-graph', element: <IntelKnowledgeGraphPage /> },
          { path: '/intel/notifications', element: <IntelNotificationsPage /> },
          { path: '/intel/sources', element: <IntelSourcesPage /> },
          { path: '/intel/sources/preferences', element: <SourcesPage /> },
          { path: '/intel/jobs', element: <IntelJobsPage /> },
        ],
      },
    ],
  },
]);
