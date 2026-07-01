import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Files, Ship, Mail, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: Files, label: 'Documents', to: '/documents' },
  { icon: Ship, label: 'Shipments', to: '/shipments' },
  { icon: Mail, label: 'Email', to: '/email' },
];

export function Sidebar() {
  const { data: user } = useCurrentUser();

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-background">
      {/* Org name */}
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-sm font-semibold truncate">{user?.org_id ?? 'BrokerAI'}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* Admin-only Users link */}
        {user?.role === 'admin' && (
          <NavLink
            to="/settings/users"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Users className="h-4 w-4 shrink-0" />
            Users
          </NavLink>
        )}
      </nav>

      {/* User role badge */}
      <div className="border-t p-4">
        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        {user?.role && (
          <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-medium capitalize">
            {user.role}
          </span>
        )}
      </div>
    </aside>
  );
}
