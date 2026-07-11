import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Files, Ship, Mail, Users, Settings, Boxes, Newspaper,
  Cpu, RefreshCw, Globe2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const mainNav = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard', exact: true },
  { icon: Files, label: 'Documents', to: '/documents' },
  { icon: Ship, label: 'Shipments', to: '/shipments' },
  { icon: Mail, label: 'Email', to: '/email' },
  { icon: Newspaper, label: 'Trade Intel', to: '/intel', exact: true },
  { icon: Globe2, label: 'Sources', to: '/intel/sources/preferences' },
];

const adminNav = [
  { icon: Users, label: 'Users', to: '/settings/users' },
  { icon: Settings, label: 'Org Settings', to: '/settings/org' },
  { icon: Cpu, label: 'Intel Sources', to: '/intel/sources' },
  { icon: RefreshCw, label: 'Intel Jobs', to: '/intel/jobs' },
];

function NavItem({ icon: Icon, label, to, exact = false }: {
  icon: typeof LayoutDashboard; label: string; to: string; exact?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-white/10 text-white'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-4 w-4 shrink-0 transition-colors', isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')} />
          {label}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { data: user } = useCurrentUser();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col bg-slate-900">
      {/* Logo / org name */}
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-800 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500">
          <Boxes className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {user?.org_id ?? 'Veritariff'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <div className="space-y-0.5">
          {mainNav.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>

        {user?.role === 'admin' && (
          <div className="mt-5">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Admin
            </p>
            <div className="space-y-0.5">
              {adminNav.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-800 px-4 py-3">
        <p className="truncate text-xs text-slate-400">{user?.email}</p>
        {user?.role && (
          <span className="mt-1 inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            {user.role}
          </span>
        )}
      </div>
    </aside>
  );
}
