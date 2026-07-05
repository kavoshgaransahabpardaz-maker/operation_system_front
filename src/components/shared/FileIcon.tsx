import { FileText, Image, File, Sheet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  contentType: string;
  className?: string;
}

const SPREADSHEET_TYPES = new Set([
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'text/xml',
  'application/xml',
]);

export function FileIcon({ contentType, className }: FileIconProps) {
  const cls = cn('h-4 w-4', className);
  if (contentType === 'application/pdf') return <FileText className={cls} />;
  if (contentType.startsWith('image/')) return <Image className={cls} />;
  if (SPREADSHEET_TYPES.has(contentType)) return <Sheet className={cls} />;
  return <File className={cls} />;
}
