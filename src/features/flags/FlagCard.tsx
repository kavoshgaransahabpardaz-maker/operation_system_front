import { Link } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, Info, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { FLAG_TYPE_LABELS, FLAG_SEVERITY_ICON_COLORS, FIELD_NAME_LABELS } from '@/lib/constants';
import { formatRelative } from '@/lib/utils';
import type { Flag } from '@/types';

const SEVERITY_ICONS = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
};

interface Props {
  flag: Flag;
  onResolve: (flag: Flag) => void;
}

export function FlagCard({ flag, onResolve }: Props) {
  const Icon = SEVERITY_ICONS[flag.severity];
  const isResolved = flag.status === 'resolved';

  return (
    <div
      className={`rounded-lg border p-4 space-y-3 ${
        isResolved ? 'opacity-60' : ''
      } ${
        flag.severity === 'critical'
          ? 'border-l-4 border-l-red-500'
          : flag.severity === 'warning'
            ? 'border-l-4 border-l-amber-500'
            : 'border-l-4 border-l-blue-400'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${FLAG_SEVERITY_ICON_COLORS[flag.severity]}`} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity={flag.severity} />
              <span className="text-xs text-muted-foreground">{FLAG_TYPE_LABELS[flag.flag_type]}</span>
            </div>
            <p className="mt-1 font-medium text-sm">{flag.title}</p>
            <p className="text-sm text-muted-foreground">{flag.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isResolved ? (
            <span className="flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
              <CheckCheck className="h-3 w-3" /> Resolved
            </span>
          ) : (
            <Button size="sm" variant="outline" onClick={() => onResolve(flag)}>
              Resolve
            </Button>
          )}
        </div>
      </div>

      {flag.conflicting_values && flag.conflicting_values.length > 0 && (
        <div className="ml-6 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Conflicting values:</p>
          <ul className="space-y-0.5">
            {flag.conflicting_values.map((cv, i) => (
              <li key={i} className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">•</span>
                <Link
                  to={`/documents/${cv.document_id}`}
                  className="text-primary hover:underline text-xs"
                >
                  {FIELD_NAME_LABELS[cv.field_name] ?? cv.field_name}
                  {cv.page_number != null ? ` (p.${cv.page_number})` : ''}
                </Link>
                <span className="font-mono text-xs">{cv.value_raw}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="ml-6 text-xs text-muted-foreground">
        {isResolved && flag.resolved_at
          ? `Resolved ${formatRelative(flag.resolved_at)}`
          : `Open since ${formatRelative(flag.created_at)}`}
      </div>
    </div>
  );
}
