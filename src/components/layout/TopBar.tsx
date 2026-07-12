import { LogOut, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { session } from '@/lib/session';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/workspace': 'Workspace',
  '/documents': 'Documents',
  '/shipments': 'Shipments',
  '/email': 'Email Connections',
  '/tradewatch': 'TradeWatch',
  '/tradewatch/search': 'TradeWatch — Search',
  '/tradewatch/analytics': 'TradeWatch — Analytics',
  '/tradewatch/knowledge-graph': 'TradeWatch — Knowledge Graph',
  '/admin': 'Admin Panel',
  '/superadmin': 'Super Admin',
  '/settings/notifications': 'Notification Preferences',
  '/settings/interests': 'My Interests',
  '/settings/sources': 'News Sources',
};

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/tradewatch/articles/')) return 'TradeWatch — Article';
  if (pathname.startsWith('/workspace/documents/')) return 'Document Detail';
  if (pathname.startsWith('/workspace/shipments/')) return 'Shipment Detail';
  if (pathname.startsWith('/documents/')) return 'Document Detail';
  if (pathname.startsWith('/shipments/')) return 'Shipment Detail';
  return 'Veritariff';
}

export function TopBar() {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  function handleLogout() {
    session.clearToken();
    queryClient.clear();
    navigate('/login');
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-6">
      <h2 className="text-sm font-semibold text-foreground">
        {getTitle(location.pathname)}
      </h2>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <div className="mx-2 h-5 w-px bg-border" />

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
            {user?.email?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <span className="hidden max-w-[160px] truncate text-sm text-muted-foreground sm:block">
            {user?.email}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="ml-1 h-8 w-8 text-muted-foreground"
          onClick={handleLogout}
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
