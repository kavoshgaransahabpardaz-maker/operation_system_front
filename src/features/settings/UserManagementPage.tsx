import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole } from '@/types';
import type { AxiosError } from 'axios';

const ROLES: UserRole[] = ['admin', 'manager', 'operator'];

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'operator']).default('operator'),
});
type InviteFormData = z.infer<typeof inviteSchema>;

export function UserManagementPage() {
  const queryClient = useQueryClient();
  const { data: me } = useCurrentUser();
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: queryKeys.users,
    queryFn: () => authApi.listUsers().then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { role?: UserRole; is_active?: boolean } }) =>
      authApi.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toast.success('User updated');
    },
    onError: (e: AxiosError<{ detail?: string }>) =>
      toast.error(e.response?.data?.detail ?? 'Update failed.'),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'operator' },
  });

  async function onInvite(data: InviteFormData) {
    try {
      await authApi.createUser(data);
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toast.success('User invited');
      reset();
      setInviteOpen(false);
    } catch (err) {
      const msg = (err as AxiosError<{ detail?: string }>).response?.data?.detail ?? 'Invite failed.';
      setError('root', { message: msg });
    }
  }

  // Non-admins see a 403 message
  if (me && me.role !== 'admin') {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2">
        <p className="text-lg font-semibold">403 — You don't have permission</p>
        <p className="text-sm text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Team Members</h1>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onInvite)} className="space-y-4">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <p className="text-xs text-muted-foreground">
                The invited user will sign in using Google with this email address.
              </p>
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={watch('role')} onValueChange={(v) => setValue('role', v as InviteFormData['role'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.root && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errors.root.message}
                </p>
              )}
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Inviting…' : 'Invite'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Spinner size="lg" className="mt-20" />
      ) : !users?.length ? (
        <EmptyState icon={Users} title="No team members" description="Invite your first user." />
      ) : (
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(v) =>
                        updateMutation.mutate({ userId: user.id, data: { role: v as UserRole } })
                      }
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                      />
                      <span className="text-sm">{user.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={(v) =>
                        updateMutation.mutate({ userId: user.id, data: { is_active: v } })
                      }
                      title={user.is_active ? 'Deactivate' : 'Activate'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
