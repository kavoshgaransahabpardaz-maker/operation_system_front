import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/api';
import type { AxiosError } from 'axios';

const schema = z.object({ email: z.string().email('Invalid email') });
type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [resetToken, setResetToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const res = await authApi.requestPasswordReset(data.email);
      setResetToken(res.data.reset_token);
      toast.success('Reset token generated.');
    } catch (err) {
      const msg =
        (err as AxiosError<{ detail?: string }>).response?.data?.detail ?? 'Request failed.';
      setError('root', { message: msg });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-background p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email to receive a reset token.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {errors.root && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Request reset'}
          </Button>
        </form>

        {resetToken && (
          <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-medium text-amber-800">
              In production this is emailed to you. Copy this token to reset your password.
            </p>
            <code className="block break-all rounded bg-amber-100 p-2 text-xs font-mono text-amber-900">
              {resetToken}
            </code>
            <Link
              to={`/reset-password?token=${resetToken}`}
              className="text-xs font-medium text-primary hover:underline"
            >
              Go to reset password →
            </Link>
          </div>
        )}

        <p className="text-center text-sm">
          <Link to="/login" className="text-muted-foreground hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
