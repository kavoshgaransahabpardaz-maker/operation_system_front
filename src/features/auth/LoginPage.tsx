import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authApi } from '@/api';
import { session } from '@/lib/session';

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  if (session.hasToken()) return <Navigate to="/dashboard" replace />;

  async function handleGoogleSuccess(credential: string) {
    setError(null);
    try {
      const res = await authApi.googleLogin(credential);
      session.setToken(res.data.access_token);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      if (detail?.toLowerCase().includes('no account') || (err as { response?: { status?: number } }).response?.status === 401) {
        setError('No Veritariff account linked to this Google address. Ask your admin to invite you.');
      } else {
        setError(detail ?? 'Sign-in failed. Please try again.');
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-background p-8 shadow-sm text-center">
        <div>
          <h1 className="text-2xl font-bold">Veritariff</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <div className="flex justify-center">
          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <GoogleLogin
              onSuccess={(res) => {
                if (res.credential) handleGoogleSuccess(res.credential);
              }}
              onError={() => setError('Google sign-in failed. Please try again.')}
              useOneTap={false}
            />
          ) : (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <strong>Config error:</strong> VITE_GOOGLE_CLIENT_ID is not set.
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive text-left">
            {error}
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          Don&apos;t have an organisation?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Set one up →
          </Link>
        </p>
      </div>
    </div>
  );
}
