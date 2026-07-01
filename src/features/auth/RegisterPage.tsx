import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/api';
import { slugify } from '@/lib/utils';
import type { AxiosError } from 'axios';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  org_name: z.string().min(1, 'Organization name is required'),
  org_slug: z.string().min(1, 'Organization slug is required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
});
type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function handleOrgNameBlur() {
    const name = watch('org_name');
    if (name) setValue('org_slug', slugify(name));
  }

  async function onSubmit(data: FormData) {
    try {
      await authApi.register(data);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      const msg =
        (err as AxiosError<{ detail?: string }>).response?.data?.detail ?? 'Registration failed.';
      setError('root', { message: msg });
      toast.error(msg);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-background p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Set up your BrokerAI organization</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="org_name">Organization name</Label>
            <Input id="org_name" {...register('org_name')} onBlur={handleOrgNameBlur} />
            {errors.org_name && <p className="text-xs text-destructive">{errors.org_name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="org_slug">Organization slug</Label>
            <Input id="org_slug" {...register('org_slug')} />
            {errors.org_slug && <p className="text-xs text-destructive">{errors.org_slug.message}</p>}
          </div>

          {errors.root && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
