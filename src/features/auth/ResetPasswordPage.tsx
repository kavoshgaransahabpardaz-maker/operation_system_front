import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/api';
import type { AxiosError } from 'axios';

const schema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    new_password: z.string().min(8, 'Minimum 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });
type FormData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tokenFromUrl = params.get('token') ?? '';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { token: tokenFromUrl },
  });

  async function onSubmit(data: FormData) {
    try {
      await authApi.confirmPasswordReset(data.token, data.new_password);
      toast.success('Password updated');
      navigate('/login');
    } catch (err) {
      const msg =
        (err as AxiosError<{ detail?: string }>).response?.data?.detail ?? 'Reset failed.';
      setError('root', { message: msg });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-background p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Set new password</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="token">Reset token</Label>
            <Input id="token" readOnly={!!tokenFromUrl} {...register('token')} />
            {errors.token && <p className="text-xs text-destructive">{errors.token.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="new_password">New password</Label>
            <Input id="new_password" type="password" {...register('new_password')} />
            {errors.new_password && (
              <p className="text-xs text-destructive">{errors.new_password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirm_password">Confirm password</Label>
            <Input id="confirm_password" type="password" {...register('confirm_password')} />
            {errors.confirm_password && (
              <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>

        <p className="text-center text-sm">
          <Link to="/login" className="text-muted-foreground hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
