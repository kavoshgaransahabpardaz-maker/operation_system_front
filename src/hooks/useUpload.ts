import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { documentsApi } from '@/api';
import { MAX_FILE_BYTES, MAX_BATCH_FILES } from '@/lib/constants';
import type { Document } from '@/types';
import type { AxiosError } from 'axios';

export interface UploadProgress {
  total: number;
  done: number;
  uploading: boolean;
  error: string | null;
}

export function useUpload(onSuccess?: (docs: Document[]) => void) {
  const [progress, setProgress] = useState<UploadProgress>({
    total: 0, done: 0, uploading: false, error: null,
  });
  const queryClient = useQueryClient();

  async function upload(fileList: FileList | File[]): Promise<Document[]> {
    const files = Array.from(fileList);

    if (files.length === 0) return [];

    const oversized = files.filter((f) => f.size > MAX_FILE_BYTES);
    if (oversized.length) {
      const msg = `${oversized.length} file${oversized.length > 1 ? 's' : ''} exceed the 1 GB limit.`;
      setProgress((p) => ({ ...p, error: msg }));
      toast.error(msg);
      return [];
    }

    if (files.length > MAX_BATCH_FILES) {
      const msg = `Maximum ${MAX_BATCH_FILES} files per upload.`;
      setProgress((p) => ({ ...p, error: msg }));
      toast.error(msg);
      return [];
    }

    setProgress({ total: files.length, done: 0, uploading: true, error: null });

    try {
      const { data } = files.length === 1
        ? await documentsApi.upload(files[0]).then((r) => ({ data: [r.data] }))
        : await documentsApi.uploadBatch(files);

      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(
        data.length === 1
          ? 'Document uploaded — processing started'
          : `${data.length} documents uploaded — processing started`,
      );
      setProgress({ total: files.length, done: files.length, uploading: false, error: null });
      onSuccess?.(data);
      return data;
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      let msg: string;
      if (axiosErr.response?.status === 409) {
        msg = 'One or more files have already been uploaded.';
      } else if (axiosErr.response?.status === 415) {
        msg = axiosErr.response.data?.detail ?? 'Unsupported file type.';
      } else {
        msg = axiosErr.response?.data?.detail ?? 'Upload failed.';
      }
      setProgress((p) => ({ ...p, uploading: false, error: msg }));
      toast.error(msg);
      return [];
    }
  }

  return {
    upload,
    uploading: progress.uploading,
    uploadProgress: progress,
  };
}
