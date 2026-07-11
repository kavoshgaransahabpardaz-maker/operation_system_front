import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/api';
import { session } from '@/lib/session';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const orgSchema = z.object({
  org_name: z.string().min(1, 'Organisation name is required'),
  org_slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
});
type OrgFormData = z.infer<typeof orgSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [credential, setCredential] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<OrgFormData>({
    resolver: zodResolver(orgSchema),
  });

  function handleOrgNameBlur() {
    const name = watch('org_name');
    if (name) setValue('org_slug', slugify(name));
  }

  async function onSubmit(data: OrgFormData) {
    if (!credential) return;
    setError(null);
    setSubmitting(true);
    try {
      await authApi.registerWithGoogle({ credential, org_name: data.org_name, org_slug: data.org_slug });
      // Immediately sign in with same credential
      const res = await authApi.googleLogin(credential);
      session.setToken(res.data.access_token);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail ?? 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-background p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Create organisation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Set up your BrokerAI organisation</p>
        </div>

        {/* Step 1 — Google sign-in */}
        {!credential && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Step 1: Sign in with Google</p>
            <div className="flex justify-center">
              {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                <GoogleLogin
                  onSuccess={(res) => {
                    if (!res.credential) return;
                    setCredential(res.credential);
                    // Decode email from JWT payload (base64)
                    try {
                      const payload = JSON.parse(atob(res.credential.split('.')[1]));
                      setGoogleEmail(payload.email ?? null);
                    } catch {
                      // ignore decode errors
                    }
                  }}
                  onError={() => setError('Google sign-in failed. Please try again.')}
                />
              ) : (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <strong>Config error:</strong> VITE_GOOGLE_CLIENT_ID is not set.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2 — Org details */}
        {credential && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Step 2: Name your organisation
            </p>

            {googleEmail && (
              <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                Signing up as <strong>{googleEmail}</strong>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="org_name">Organisation name</Label>
              <Input id="org_name" {...register('org_name')} onBlur={handleOrgNameBlur} />
              {errors.org_name && <p className="text-xs text-destructive">{errors.org_name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="org_slug">Organisation slug</Label>
              <Input id="org_slug" {...register('org_slug')} />
              <p className="text-xs text-muted-foreground">Used in URLs. Lowercase, no spaces.</p>
              {errors.org_slug && <p className="text-xs text-destructive">{errors.org_slug.message}</p>}
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create organisation'}
            </Button>

            <button
              type="button"
              className="w-full text-xs text-muted-foreground hover:underline"
              onClick={() => { setCredential(null); setGoogleEmail(null); setError(null); }}
            >
              ← Use a different Google account
            </button>
          </form>
        )}

        {!credential && error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
