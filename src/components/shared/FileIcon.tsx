import { FileText, Image, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileIconProps {
  contentType: string;
  className?: string;
}

export function FileIcon({ contentType, className }: FileIconProps) {
  const cls = cn('h-4 w-4', className);
  if (contentType === 'application/pdf') return <FileText className={cls} />;
  if (contentType.startsWith('image/')) return <Image className={cls} />;
  return <File className={cls} />;
}
