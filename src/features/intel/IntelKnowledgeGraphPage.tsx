import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ExternalLink } from 'lucide-react';
import { intelApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/shared/Spinner';

const SUBJECT_TYPES = ['country', 'hs_code', 'company', 'regulation'] as const;
type SubjectType = typeof SUBJECT_TYPES[number];

export function IntelKnowledgeGraphPage() {
  const navigate = useNavigate();
  const [subjectType, setSubjectType] = useState<SubjectType>('hs_code');
  const [subjectValue, setSubjectValue] = useState('');
  const [submitted, setSubmitted] = useState<{ type: SubjectType; value: string } | null>(null);

  const { data: relations, isLoading } = useQuery({
    queryKey: queryKeys.intelKnowledgeGraph(submitted?.type ?? '', submitted?.value ?? ''),
    queryFn: () => intelApi.knowledgeGraph(submitted!.type, submitted!.value).then((r) => r.data),
    enabled: !!submitted,
  });

  function handleExplore(e: React.FormEvent) {
    e.preventDefault();
    if (subjectValue.trim()) setSubmitted({ type: subjectType, value: subjectValue.trim() });
  }

  const OBJECT_TYPE_COLORS: Record<string, string> = {
    country: 'bg-blue-100 text-blue-700',
    hs_code: 'bg-green-100 text-green-700',
    company: 'bg-purple-100 text-purple-700',
    regulation: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold">Knowledge Graph</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Explore entity relationships extracted from trade intelligence articles.
        </p>
      </div>

      {/* Search panel */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <form className="flex flex-wrap items-center gap-3" onSubmit={handleExplore}>
          <select
            value={subjectType}
            onChange={(e) => setSubjectType(e.target.value as SubjectType)}
            className="rounded-md border bg-white px-2 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            {SUBJECT_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={subjectValue}
              onChange={(e) => setSubjectValue(e.target.value)}
              placeholder="e.g. 7208, GB, Acme Steel…"
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={!subjectValue.trim()}>
            Explore
          </Button>
        </form>
      </div>

      {/* Results */}
      {isLoading && <Spinner size="lg" className="py-16" />}

      {relations && (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b px-5 py-3 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold">{submitted?.value}</span>
              <span className="ml-2 text-xs text-muted-foreground">({submitted?.type})</span>
            </div>
            <span className="text-xs text-muted-foreground">{relations.length} relation{relations.length !== 1 ? 's' : ''}</span>
          </div>

          {relations.length === 0 ? (
            <p className="px-5 py-8 text-sm text-center text-muted-foreground">
              No relations found for "{submitted?.value}". Try a different entity.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-xs text-slate-500">
                  <th className="px-5 py-2.5 text-left font-medium">Subject</th>
                  <th className="px-4 py-2.5 text-left font-medium">Predicate</th>
                  <th className="px-4 py-2.5 text-left font-medium">Object</th>
                  <th className="px-4 py-2.5 text-left font-medium">Confidence</th>
                  <th className="px-4 py-2.5 text-left font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {relations.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${OBJECT_TYPE_COLORS[r.subject_type] ?? 'bg-slate-100 text-slate-700'}`}>
                        {r.subject_value}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 italic">{r.predicate}</td>
                    <td className="px-4 py-3">
                      <button
                        className={`rounded-full px-2 py-0.5 text-xs font-medium hover:opacity-80 ${OBJECT_TYPE_COLORS[r.object_type] ?? 'bg-slate-100 text-slate-700'}`}
                        onClick={() => {
                          setSubjectType(r.object_type as SubjectType);
                          setSubjectValue(r.object_value);
                          setSubmitted({ type: r.object_type as SubjectType, value: r.object_value });
                        }}
                      >
                        {r.object_value}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {(r.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3">
                      {r.article_id ? (
                        <button
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          onClick={() => navigate(`/intel/articles/${r.article_id}`)}
                        >
                          Article <ExternalLink className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
