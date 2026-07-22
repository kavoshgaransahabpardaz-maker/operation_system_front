import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { saSession } from '@/lib/sa_session';

export function SaShell() {
  const navigate = useNavigate();

  function handleLogout() {
    saSession.clearToken();
    navigate('/sa/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b border-slate-800 bg-slate-900/80 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2 text-red-400">
          <ShieldAlert className="h-5 w-5" />
          <span className="text-sm font-bold tracking-tight text-white">
            Super Admin
          </span>
        </div>

        <nav className="flex items-center gap-1 ml-6">
          {[
            { label: 'Overview', hash: 'overview' },
            { label: 'Users', hash: 'users' },
            { label: 'Organisations', hash: 'orgs' },
            { label: 'Sources', hash: 'sources' },
            { label: 'Jobs', hash: 'jobs' },
          ].map((item) => (
            <a
              key={item.hash}
              href={`#${item.hash}`}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
