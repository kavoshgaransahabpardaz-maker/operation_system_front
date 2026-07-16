import type { ExtractedField } from '@/types';

/** Convert ISO 3166-1 alpha-2 or leading 2 chars of currency code → flag emoji */
export function isoFlag(code: string): string {
  if (!code) return '';
  const base = code.toUpperCase().slice(0, 2);
  if (!/^[A-Z]{2}$/.test(base)) return '';
  return Array.from(base)
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

/** Format a raw value string according to the field's field_type */
export function formatValue(
  value: string | null,
  fieldType: ExtractedField['field_type'],
): string {
  if (!value) return '—';

  if (fieldType === 'date') {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      }
    } catch {
      // fall through to raw value
    }
  }

  if (fieldType === 'iso_code') {
    const flag = isoFlag(value);
    return flag ? `${flag} ${value}` : value;
  }

  return value;
}

/** Rendered value cell content — handles corrected, typed, and raw states */
export function FieldValueCell({ field }: { field: ExtractedField }) {
  if (field.status === 'corrected' && field.corrected_value != null) {
    return (
      <span className="flex flex-col gap-0.5">
        <span className="line-through text-muted-foreground text-xs">
          {field.value_raw}
        </span>
        <span className="text-green-700 font-medium">
          {formatValue(field.corrected_value, field.field_type)}
        </span>
      </span>
    );
  }

  return <span>{formatValue(field.value_normalized ?? field.value_raw, field.field_type)}</span>;
}
