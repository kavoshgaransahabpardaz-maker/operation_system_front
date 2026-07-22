import { Outlet, useNavigate } from 'react-router-dom';
import { ShieldAlert, Boxes, LogOut } from 'lucide-react';
import { saSession } from '@/lib/sa_session';

export function SaShell() {
  const navigate = useNavigate();

  function handleLogout() {
    saSession.clearToken();
    navigate('/sa/login', { replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fb]">
      {/* Sidebar — matches main app Sidebar */}
      <aside className="flex h-full w-56 shrink-0 flex-col bg-slate-900">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-slate-800 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500">
            <Boxes className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Veritariff</p>
          </div>
        </div>

        {/* Nav section label */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Platform
          </p>
          <div className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-white" />
            <span className="text-sm font-medium text-white">Super Admin</span>
          </div>
        </nav>

        {/* Sign out */}
        <div className="border-t border-slate-800 px-3 py-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-xs font-medium text-slate-400">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
