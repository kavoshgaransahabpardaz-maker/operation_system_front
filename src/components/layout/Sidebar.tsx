import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Settings, Boxes, Newspaper,
  Briefcase, RefreshCw, LogOut, Bell, BookOpen, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';
import { session } from '@/lib/session';

const mainNav = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard', exact: true },
  { icon: Briefcase, label: 'Workspace', to: '/workspace' },
  { icon: Newspaper, label: 'TradeWatch', to: '/tradewatch', exact: true },
];

const adminNav = [
  { icon: Users, label: 'Users', to: '/settings/users' },
  { icon: Settings, label: 'Org Settings', to: '/settings/org' },
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    session.clearToken();
    queryClient.clear();
    navigate('/login');
  }

  function handleNavLink(path: string) {
    setMenuOpen(false);
    navigate(path);
  }

  const initial = user?.email?.charAt(0).toUpperCase() ?? '?';

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

      {/* User profile button with popover */}
      <div className="border-t border-slate-800 px-3 py-3 relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[11px] font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-300">{user?.email}</p>
            {user?.role && (
              <p className="text-[10px] uppercase tracking-wide text-slate-500">{user.role}</p>
            )}
          </div>
        </button>

        {menuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-slate-700 bg-slate-800 shadow-xl">
            {/* User info */}
            <div className="px-4 py-3 border-b border-slate-700">
              <p className="text-xs font-semibold text-white truncate">{user?.email}</p>
              {user?.role && (
                <p className="text-[10px] uppercase tracking-wide text-slate-400 mt-0.5">{user.role}</p>
              )}
            </div>

            {/* Settings links */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => handleNavLink('/settings/notifications')}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors"
              >
                <Bell className="h-3.5 w-3.5 text-slate-400" />
                Notification Preferences
              </button>
              <button
                type="button"
                onClick={() => handleNavLink('/settings/interests')}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                My Interests
              </button>
              <button
                type="button"
                onClick={() => handleNavLink('/settings/sources')}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors"
              >
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                News Sources
              </button>
            </div>

            {/* Sign out */}
            <div className="border-t border-slate-700 py-1">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
