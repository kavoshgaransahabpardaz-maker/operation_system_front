import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { saAuthApi } from '@/api/sa_auth';
import { saSession } from '@/lib/sa_session';

export function SaLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await saAuthApi.login(username.trim(), password);
      saSession.setToken(res.data.access_token);
      navigate('/sa', { replace: true });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail ?? 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-700/20 border border-red-700/40">
            <ShieldAlert className="h-6 w-6 text-red-400" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold text-white tracking-tight">
              Super Admin Panel
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Restricted access — authorised personnel only
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Username
            </label>
            <input
              type="email"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="admin@example.com"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-700/60 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-700/60 transition-all"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-950/60 border border-red-800/40 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-red-700 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-all"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-slate-700">
          This panel is completely separate from the main application login.
        </p>
      </div>
    </div>
  );
}
