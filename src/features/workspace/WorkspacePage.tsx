import { useSearchParams } from 'react-router-dom';
import { Mail, Files, Ship } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmailConnectionsPage } from '@/features/email/EmailConnectionsPage';
import { DocumentListPage } from '@/features/documents/DocumentListPage';
import { ShipmentListPage } from '@/features/shipments/ShipmentListPage';

type WorkspaceTab = 'documents' | 'shipments' | 'email';

const VALID_TABS: WorkspaceTab[] = ['documents', 'shipments', 'email'];

function isValidTab(value: string | null): value is WorkspaceTab {
  return VALID_TABS.includes(value as WorkspaceTab);
}

export function WorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: WorkspaceTab = isValidTab(tabParam) ? tabParam : 'documents';

  function handleTabChange(tab: string) {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Workspace</h1>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="documents" className="gap-2">
            <Files className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="shipments" className="gap-2">
            <Ship className="h-4 w-4" />
            Shipments
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <DocumentListPage />
        </TabsContent>

        <TabsContent value="shipments">
          <ShipmentListPage />
        </TabsContent>

        <TabsContent value="email">
          <EmailConnectionsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
