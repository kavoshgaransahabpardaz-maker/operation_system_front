import { useSearchParams } from 'react-router-dom';
import { Users, Settings, Globe, RefreshCw, ShieldCheck } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserManagementPage } from '@/features/settings/UserManagementPage';
import { OrgSettingsPage } from '@/features/settings/OrgSettingsPage';
import { IntelSourcesPage } from '@/features/intel/IntelSourcesPage';
import { IntelJobsPage } from '@/features/intel/IntelJobsPage';

type AdminTab = 'users' | 'org' | 'sources' | 'jobs';

const VALID_TABS: AdminTab[] = ['users', 'org', 'sources', 'jobs'];

function isValidTab(v: string | null): v is AdminTab {
  return VALID_TABS.includes(v as AdminTab);
}

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: AdminTab = isValidTab(tabParam) ? tabParam : 'users';

  function handleTabChange(tab: string) {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">Manage users, settings, intel sources, and pipeline jobs</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="org" className="gap-2">
            <Settings className="h-4 w-4" />
            Org Settings
          </TabsTrigger>
          <TabsTrigger value="sources" className="gap-2">
            <Globe className="h-4 w-4" />
            Intel Sources
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Pipeline Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagementPage />
        </TabsContent>

        <TabsContent value="org">
          <OrgSettingsPage />
        </TabsContent>

        <TabsContent value="sources">
          <IntelSourcesPage />
        </TabsContent>

        <TabsContent value="jobs">
          <IntelJobsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
