import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { saAuthApi } from '@/api/sa_auth';
import { saSession } from '@/lib/sa_session';
import { Spinner } from '@/components/shared/Spinner';

export function SaGuard() {
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading');

  useEffect(() => {
    if (!saSession.hasToken()) {
      setState('denied');
      return;
    }
    saAuthApi.me()
      .then(() => setState('ok'))
      .catch(() => {
        saSession.clearToken();
        setState('denied');
      });
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Spinner size="lg" className="text-slate-600" />
      </div>
    );
  }
  if (state === 'denied') return <Navigate to="/sa/login" replace />;
  return <Outlet />;
}
