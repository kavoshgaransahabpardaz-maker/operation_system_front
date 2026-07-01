import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { session } from '@/lib/session';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function TopBar() {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function handleLogout() {
    session.clearToken();
    queryClient.clear();
    navigate('/login');
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{user?.email}</span>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
