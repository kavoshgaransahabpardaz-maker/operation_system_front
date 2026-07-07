import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowLeft } from 'lucide-react';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { IntelArticleCard } from './components/IntelArticleCard';

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 400;

export function IntelSearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from URL on navigation
  useEffect(() => {
    const qParam = searchParams.get('q') ?? '';
    setQ(qParam);
    setDebouncedQ(qParam);
    setPage(1);
  }, [searchParams]);

  // Debounce input changes
  function handleInputChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(value.trim());
      setPage(1);
      if (value.trim()) {
        const next = new URLSearchParams(searchParams);
        next.set('q', value.trim());
        setSearchParams(next, { replace: true });
      }
    }, DEBOUNCE_MS);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim()) {
      const next = new URLSearchParams(searchParams);
      next.set('q', q.trim());
      setSearchParams(next, { replace: true });
      setDebouncedQ(q.trim());
      setPage(1);
    }
  }

  const { data: results, isLoading } = useQuery({
    queryKey: queryKeys.intelSearch(debouncedQ, { page }),
    queryFn: () => intelApi.search(debouncedQ, PAGE_SIZE).then((r) => r.data),
    enabled: !!debouncedQ.trim(),
    placeholderData: (prev) => prev,
  });

  // Client-side slice for search (API returns flat list)
  const paged = results?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];
  const total = paged.length;
  const hasMore = results ? results.length > page * PAGE_SIZE : false;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/intel')}>
          <ArrowLeft className="h-3.5 w-3.5" /> Feed
        </Button>
        <form className="flex flex-1 items-center gap-2" onSubmit={handleSubmit}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search trade intelligence…"
              className="pl-9"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={!q.trim()}>Search</Button>
        </form>
      </div>

      {debouncedQ && (
        <p className="text-sm text-muted-foreground">
          Results for <strong>"{debouncedQ}"</strong>
          {results ? ` — ${results.length} found` : ''}
        </p>
      )}

      {isLoading ? (
        <Spinner size="lg" className="py-16" />
      ) : !debouncedQ ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          Enter a search term — e.g. 'steel tariff', 'UK sanctions', 'HS 7208'
        </p>
      ) : !results?.length ? (
        <EmptyState
          icon={Search}
          title="No results"
          description={`No articles matched "${debouncedQ}". Try different keywords or browse the feed.`}
          action={
            <Button variant="outline" onClick={() => navigate('/intel')}>
              Browse Feed
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {paged.map((item) => (
              <IntelArticleCard
                key={item.article.id}
                item={item}
                onClick={() => navigate(`/intel/articles/${item.article.id}`)}
              />
            ))}
          </div>

          {results.length > PAGE_SIZE && (
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              hasMore={hasMore}
              onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          )}
        </>
      )}
    </div>
  );
}
