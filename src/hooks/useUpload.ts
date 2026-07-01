import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { documentsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { MAX_FILE_BYTES } from '@/lib/constants';
import type { Document } from '@/types';
import type { AxiosError } from 'axios';

interface UploadState {
  uploading: boolean;
  error: string | null;
}

export function useUpload(onSuccess?: (doc: Document) => void) {
  const [state, setState] = useState<UploadState>({ uploading: false, error: null });
  const queryClient = useQueryClient();

  async function upload(file: File): Promise<Document | null> {
    if (file.size > MAX_FILE_BYTES) {
      const msg = 'File exceeds 50 MB limit.';
      setState({ uploading: false, error: msg });
      toast.error(msg);
      return null;
    }

    setState({ uploading: true, error: null });

    try {
      const { data } = await documentsApi.upload(file);
      await queryClient.invalidateQueries({ queryKey: queryKeys.documents() });
      toast.success('Document uploaded — processing started');
      setState({ uploading: false, error: null });
      onSuccess?.(data);
      return data;
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      if (axiosErr.response?.status === 409) {
        const msg = 'This file has already been uploaded.';
        setState({ uploading: false, error: msg });
        toast.error(msg);
      } else {
        const msg = axiosErr.response?.data?.detail ?? 'Upload failed.';
        setState({ uploading: false, error: msg });
        toast.error(msg);
      }
      return null;
    }
  }

  return { upload, ...state };
}
