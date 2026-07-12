import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  ShieldAlert,
  Users,
  Building2,
  Globe,
  RefreshCw,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { superAdminApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatDate, formatRelative, slugify } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole, UserOutWithOrg, OrgOutWithStats, IntelSource, IntelJob } from '@/types';
import type { AxiosError } from 'axios';

// ── Types ──────────────────────────────────────────────────────────────────────

type SuperAdminTab = 'users' | 'orgs' | 'sources' | 'jobs' | 'analytics';

const VALID_TABS: SuperAdminTab[] = ['users', 'orgs', 'sources', 'jobs', 'analytics'];

function isValidTab(value: string | null): value is SuperAdminTab {
  return VALID_TABS.includes(value as SuperAdminTab);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

function errorMessage(e: unknown): string {
  const axiosErr = e as AxiosError<{ detail?: string }>;
  return axiosErr?.response?.data?.detail ?? 'Operation failed';
}

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-teal-100 text-teal-700',
  operator: 'bg-slate-100 text-slate-600',
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', ROLE_BADGE_COLORS[role])}>
      {ROLE_LABELS[role]}
    </span>
  );
}

// ── UsersTab ──────────────────────────────────────────────────────────────────

function UsersTab() {
  const { data: me } = useCurrentUser();
  const queryClient = useQueryClient();

  const [emailSearch, setEmailSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [orgFilter, setOrgFilter] = useState<string | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deactivateTarget, setDeactivateTarget] = useState<UserOutWithOrg | null>(null);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.superAdminUsers({}),
    queryFn: () => superAdminApi.listUsers().then((r) => r.data),
  });

  const { data: orgs } = useQuery({
    queryKey: queryKeys.superAdminOrgs,
    queryFn: () => superAdminApi.listOrgs().then((r) => r.data),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { role?: UserRole; is_active?: boolean } }) =>
      superAdminApi.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdminUsers({}) });
      toast.success('User updated');
    },
    onError: (e: unknown) => {
      toast.error(errorMessage(e));
    },
  });

  const filtered = (users ?? []).filter((u) => {
    if (emailSearch && !u.email.toLowerCase().includes(emailSearch.toLowerCase())) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (orgFilter !== 'all' && u.org_id !== orgFilter) return false;
    if (activeFilter === 'active' && !u.is_active) return false;
    if (activeFilter === 'inactive' && u.is_active) return false;
    return true;
  });

  if (usersLoading) return <Spinner className="py-16" />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold">All Users</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {users?.length ?? 0}
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Email search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 w-56 pl-8 text-sm"
            placeholder="Search by email…"
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
          />
        </div>

        {/* Role filter */}
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | 'all')}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="operator">Operator</SelectItem>
          </SelectContent>
        </Select>

        {/* Org filter */}
        <Select value={orgFilter} onValueChange={(v) => setOrgFilter(v)}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue placeholder="All orgs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All orgs</SelectItem>
            {(orgs ?? []).map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Active filter pills */}
        <div className="flex gap-1">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize',
                activeFilter === f
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try adjusting your filters." />
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const isSelf = me?.id === row.id;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm font-medium">{row.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.org_name}</TableCell>
                    <TableCell>
                      <RoleBadge role={row.role} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          row.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600',
                        )}
                      >
                        {row.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(row.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Inline role select */}
                        <Select
                          value={row.role}
                          disabled={isSelf}
                          onValueChange={(v) =>
                            updateUserMutation.mutate({ userId: row.id, data: { role: v as UserRole } })
                          }
                        >
                          <SelectTrigger className="h-7 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="operator">Operator</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Active toggle */}
                        <Switch
                          checked={row.is_active}
                          disabled={isSelf}
                          onCheckedChange={(checked) => {
                            if (!checked) {
                              setDeactivateTarget(row);
                            } else {
                              updateUserMutation.mutate({ userId: row.id, data: { is_active: true } });
                            }
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Deactivate confirmation dialog */}
      <Dialog open={deactivateTarget !== null} onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate user?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deactivate <span className="font-semibold text-foreground">{deactivateTarget?.email}</span>? They will
            lose access to the platform immediately.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeactivateTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deactivateTarget) return;
                updateUserMutation.mutate(
                  { userId: deactivateTarget.id, data: { is_active: false } },
                  { onSettled: () => setDeactivateTarget(null) },
                );
              }}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── OrgsTab ───────────────────────────────────────────────────────────────────

function OrgsTab() {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrgOutWithStats | null>(null);

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');

  const { data: orgs, isLoading } = useQuery({
    queryKey: queryKeys.superAdminOrgs,
    queryFn: () => superAdminApi.listOrgs().then((r) => r.data),
  });

  const createOrgMutation = useMutation({
    mutationFn: (data: { name: string; slug: string }) => superAdminApi.createOrg(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdminOrgs });
      setCreateOpen(false);
      setCreateName('');
      setCreateSlug('');
      toast.success('Organisation created');
    },
    onError: (e: unknown) => {
      toast.error(errorMessage(e));
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: { name?: string; slug?: string } }) =>
      superAdminApi.updateOrg(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdminOrgs });
      setEditTarget(null);
      toast.success('Organisation updated');
    },
    onError: (e: unknown) => {
      toast.error(errorMessage(e));
    },
  });

  function openEdit(org: OrgOutWithStats) {
    setEditTarget(org);
    setEditName(org.name);
    setEditSlug(org.slug);
  }

  if (isLoading) return <Spinner className="py-16" />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">All Organisations</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {orgs?.length ?? 0}
          </span>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Create Organisation
        </Button>
      </div>

      {/* Table */}
      {!orgs?.length ? (
        <EmptyState icon={Building2} title="No organisations" description="Create the first organisation." />
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="text-sm font-medium">{org.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{org.slug}</TableCell>
                  <TableCell className="text-sm">{org.user_count}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(org.created_at)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => openEdit(org)}
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setCreateName(''); setCreateSlug(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organisation</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createOrgMutation.mutate({ name: createName, slug: createSlug });
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label htmlFor="create-org-name">Name</Label>
              <Input
                id="create-org-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onBlur={() => { if (!createSlug) setCreateSlug(slugify(createName)); }}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-org-slug">Slug</Label>
              <Input
                id="create-org-slug"
                value={createSlug}
                onChange={(e) => setCreateSlug(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createOrgMutation.isPending}>
                {createOrgMutation.isPending ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organisation</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editTarget) return;
              updateOrgMutation.mutate({ orgId: editTarget.id, data: { name: editName, slug: editSlug } });
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label htmlFor="edit-org-name">Name</Label>
              <Input
                id="edit-org-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-org-slug">Slug</Label>
              <Input
                id="edit-org-slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateOrgMutation.isPending}>
                {updateOrgMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── SourcesTab ────────────────────────────────────────────────────────────────

interface SourceFormState {
  name: string;
  url: string;
  category: string;
  source_type: string;
  poll_cadence_minutes: number;
  priority: number;
  is_active: boolean;
}

const defaultSourceForm = (): SourceFormState => ({
  name: '',
  url: '',
  category: '',
  source_type: '',
  poll_cadence_minutes: 60,
  priority: 5,
  is_active: true,
});

function SourceFormFields({
  form,
  onChange,
  showActive,
}: {
  form: SourceFormState;
  onChange: (patch: Partial<SourceFormState>) => void;
  showActive: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="src-name">Name *</Label>
        <Input
          id="src-name"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="src-url">URL *</Label>
        <Input
          id="src-url"
          type="url"
          value={form.url}
          onChange={(e) => onChange({ url: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="src-category">Category</Label>
          <Input
            id="src-category"
            value={form.category}
            onChange={(e) => onChange({ category: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="src-type">Source Type</Label>
          <Input
            id="src-type"
            value={form.source_type}
            onChange={(e) => onChange({ source_type: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="src-cadence">Poll Cadence (min)</Label>
          <Input
            id="src-cadence"
            type="number"
            min={1}
            value={form.poll_cadence_minutes}
            onChange={(e) => onChange({ poll_cadence_minutes: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="src-priority">Priority (1–10)</Label>
          <Input
            id="src-priority"
            type="number"
            min={1}
            max={10}
            value={form.priority}
            onChange={(e) => onChange({ priority: Number(e.target.value) })}
          />
        </div>
      </div>
      {showActive && (
        <div className="flex items-center gap-2">
          <Switch
            id="src-active"
            checked={form.is_active}
            onCheckedChange={(checked) => onChange({ is_active: checked })}
          />
          <Label htmlFor="src-active">Active</Label>
        </div>
      )}
    </div>
  );
}

function SourcesTab() {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IntelSource | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<IntelSource | null>(null);

  const [createForm, setCreateForm] = useState<SourceFormState>(defaultSourceForm());
  const [editForm, setEditForm] = useState<SourceFormState>(defaultSourceForm());

  const { data: sources, isLoading } = useQuery({
    queryKey: queryKeys.superAdminSources,
    queryFn: () => superAdminApi.listSources().then((r) => r.data),
  });

  const invalidateSources = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.superAdminSources });

  const createSourceMutation = useMutation({
    mutationFn: (data: SourceFormState) =>
      superAdminApi.createSource({
        name: data.name,
        url: data.url,
        category: data.category || undefined,
        source_type: data.source_type || undefined,
        poll_cadence_minutes: data.poll_cadence_minutes,
        priority: data.priority,
        is_active: data.is_active,
      }),
    onSuccess: () => {
      invalidateSources();
      setCreateOpen(false);
      setCreateForm(defaultSourceForm());
      toast.success('Source created');
    },
    onError: (e: unknown) => {
      toast.error(errorMessage(e));
    },
  });

  const updateSourceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SourceFormState> }) =>
      superAdminApi.updateSource(id, {
        name: data.name,
        url: data.url,
        category: data.category || undefined,
        source_type: data.source_type || undefined,
        poll_cadence_minutes: data.poll_cadence_minutes,
        priority: data.priority,
        is_active: data.is_active,
      }),
    onSuccess: () => {
      invalidateSources();
      setEditTarget(null);
      toast.success('Source updated');
    },
    onError: (e: unknown) => {
      toast.error(errorMessage(e));
    },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: (id: string) => superAdminApi.deleteSource(id),
    onSuccess: () => {
      invalidateSources();
      setDeactivateTarget(null);
      toast.success('Source deactivated');
    },
    onError: (e: unknown) => {
      toast.error(errorMessage(e));
    },
  });

  function openEdit(src: IntelSource) {
    setEditTarget(src);
    setEditForm({
      name: src.name,
      url: src.url,
      category: src.category ?? '',
      source_type: src.source_type ?? '',
      poll_cadence_minutes: src.poll_cadence_minutes,
      priority: src.priority,
      is_active: src.is_active,
    });
  }

  if (isLoading) return <Spinner className="py-16" />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">All Sources</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {sources?.length ?? 0}
          </span>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add Source
        </Button>
      </div>

      {/* Table */}
      {!sources?.length ? (
        <EmptyState icon={Globe} title="No sources" description="Add the first intelligence source." />
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Polled</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((src) => (
                <TableRow key={src.id}>
                  <TableCell className="text-sm font-medium">{src.name}</TableCell>
                  <TableCell>
                    <span
                      className="block max-w-[200px] truncate text-xs text-muted-foreground"
                      title={src.url}
                    >
                      {src.url}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{src.category ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{src.source_type ?? '—'}</TableCell>
                  <TableCell className="text-sm">{src.priority}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        src.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {src.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {src.last_polled_at ? formatRelative(src.last_polled_at) : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{src.articles_collected}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => openEdit(src)}
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-red-600 hover:text-red-700"
                        onClick={() => setDeactivateTarget(src)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Deactivate
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setCreateForm(defaultSourceForm()); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Source</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createSourceMutation.mutate(createForm);
            }}
          >
            <SourceFormFields
              form={createForm}
              onChange={(patch) => setCreateForm((prev) => ({ ...prev, ...patch }))}
              showActive={false}
            />
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSourceMutation.isPending}>
                {createSourceMutation.isPending ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Source</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editTarget) return;
              updateSourceMutation.mutate({ id: editTarget.id, data: editForm });
            }}
          >
            <SourceFormFields
              form={editForm}
              onChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
              showActive={true}
            />
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateSourceMutation.isPending}>
                {updateSourceMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirmation dialog */}
      <Dialog open={deactivateTarget !== null} onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate source?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This source will stop being polled. Existing articles are kept.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeactivateTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteSourceMutation.isPending}
              onClick={() => {
                if (!deactivateTarget) return;
                deleteSourceMutation.mutate(deactivateTarget.id);
              }}
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── JobsTab ───────────────────────────────────────────────────────────────────

const JOB_STATUS_COLORS: Record<string, string> = {
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  done: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  pending: 'bg-slate-100 text-slate-600',
};

function JobsTab() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
  const [sourceFilter, setSourceFilter] = useState<string | 'all'>('all');

  const { data: jobs, isLoading } = useQuery({
    queryKey: queryKeys.superAdminJobs({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      source_id: sourceFilter !== 'all' ? sourceFilter : undefined,
      limit: 100,
    }),
    queryFn: () =>
      superAdminApi
        .listJobs({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          source_id: sourceFilter !== 'all' ? sourceFilter : undefined,
          limit: 100,
        })
        .then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: sources } = useQuery({
    queryKey: queryKeys.superAdminSources,
    queryFn: () => superAdminApi.listSources().then((r) => r.data),
  });

  if (isLoading) return <Spinner className="py-16" />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold">Jobs</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {jobs?.length ?? 0}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">Auto-refreshes every 30s</span>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status pill filters */}
        <div className="flex gap-1">
          {(['all', 'running', 'completed', 'failed'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize',
                statusFilter === s
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Source filter */}
        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v)}>
          <SelectTrigger className="h-8 w-48 text-xs">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {(sources ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {!jobs?.length ? (
        <EmptyState icon={RefreshCw} title="No jobs found" description="Try adjusting your filters." />
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Type</TableHead>
                <TableHead>Source ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Articles Processed</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job: IntelJob) => (
                <TableRow key={job.id}>
                  <TableCell className="text-sm font-medium">{job.job_type}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {job.source_id ? job.source_id.slice(0, 8) : '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                        JOB_STATUS_COLORS[job.status] ?? 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {job.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{job.articles_processed}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {job.started_at ? formatRelative(job.started_at) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {job.completed_at ? formatRelative(job.completed_at) : '—'}
                  </TableCell>
                  <TableCell>
                    {job.error_message ? (
                      <span
                        className="text-xs text-red-600"
                        title={job.error_message}
                      >
                        {job.error_message.slice(0, 60)}
                        {job.error_message.length > 60 ? '…' : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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

// ── AnalyticsTab ──────────────────────────────────────────────────────────────

interface SuperAdminAnalytics {
  total_orgs: number;
  total_users: number;
  active_users: number;
  total_sources: number;
  active_sources: number;
  total_articles: number;
  enriched_articles: number;
  total_jobs: number;
  failed_jobs: number;
  by_role: Record<string, number>;
}

interface StatCardProps {
  label: string;
  value: number;
  highlight?: 'danger' | 'success';
}

function StatCard({ label, value, highlight }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-bold tabular-nums',
          highlight === 'danger' && 'text-red-600',
          highlight === 'success' && 'text-green-600',
        )}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function AnalyticsTab() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: queryKeys.superAdminAnalytics,
    queryFn: () => superAdminApi.analytics().then((r) => r.data) as Promise<SuperAdminAnalytics>,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <Spinner className="py-16" />;
  if (!analytics) return <EmptyState icon={BarChart3} title="No analytics" description="Data unavailable." />;

  const byRole = analytics.by_role ?? {};
  const maxRoleCount = Math.max(1, ...Object.values(byRole));

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Organisations" value={analytics.total_orgs} />
        <StatCard label="Total Users" value={analytics.total_users} />
        <StatCard label="Active Users" value={analytics.active_users} highlight="success" />
        <StatCard label="Total Sources" value={analytics.total_sources} />
        <StatCard label="Active Sources" value={analytics.active_sources} highlight="success" />
        <StatCard label="Total Articles" value={analytics.total_articles} />
        <StatCard label="Enriched Articles" value={analytics.enriched_articles} highlight="success" />
        <StatCard label="Total Jobs" value={analytics.total_jobs} />
        <StatCard label="Failed Jobs" value={analytics.failed_jobs} highlight={analytics.failed_jobs > 0 ? 'danger' : undefined} />
      </div>

      {/* Users by role */}
      {Object.keys(byRole).length > 0 && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Users by Role</h3>
          <div className="space-y-2">
            {Object.entries(byRole).map(([role, count]) => (
              <div key={role} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-xs font-medium capitalize text-slate-600">
                  {ROLE_LABELS[role as UserRole] ?? role}
                </span>
                <div className="flex-1 h-4 rounded bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded bg-blue-400"
                    style={{ width: `${(count / maxRoleCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs tabular-nums text-slate-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SuperAdminPage (main export) ──────────────────────────────────────────────

export function SuperAdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: SuperAdminTab = isValidTab(tabParam) ? tabParam : 'users';

  function handleTabChange(tab: string) {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-6 w-6 text-purple-600" />
        <div>
          <h1 className="text-xl font-bold leading-tight">Super Admin</h1>
          <p className="text-xs text-muted-foreground">Platform-wide administration</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="orgs" className="gap-2">
            <Building2 className="h-4 w-4" />
            Organisations
          </TabsTrigger>
          <TabsTrigger value="sources" className="gap-2">
            <Globe className="h-4 w-4" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="orgs">
          <OrgsTab />
        </TabsContent>

        <TabsContent value="sources">
          <SourcesTab />
        </TabsContent>

        <TabsContent value="jobs">
          <JobsTab />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
