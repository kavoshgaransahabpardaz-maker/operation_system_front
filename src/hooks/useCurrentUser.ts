import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => authApi.me().then((r) => r.data),
    retry: false,
  });
}
