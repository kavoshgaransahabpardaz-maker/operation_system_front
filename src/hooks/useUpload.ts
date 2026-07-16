import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { documentsApi } from '@/api';
import { queryKeys } from '@/lib/queryKeys';
import { MAX_FILE_BYTES, MAX_BATCH_FILES } from '@/lib/constants';
import type { Document } from '@/types';
import type { AxiosError } from 'axios';

export interface UploadProgress {
  total: number;
  done: number;
  uploading: boolean;
  error: string | null;
}

const PROCESSING_STATUSES = new Set(['uploaded', 'ocr_pending', 'ocr_processing']);
const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 10 * 60 * 1_000; // 10 minutes

export function useUpload(
  onSuccess?: (docs: Document[]) => void,
  options?: { shipmentId?: string },
) {
  const [progress, setProgress] = useState<UploadProgress>({
    total: 0, done: 0, uploading: false, error: null,
  });
  const queryClient = useQueryClient();
  const pollTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const pollTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function stopPolling(docId: string) {
    const timer = pollTimers.current.get(docId);
    if (timer) { clearInterval(timer); pollTimers.current.delete(docId); }
    const timeout = pollTimeouts.current.get(docId);
    if (timeout) { clearTimeout(timeout); pollTimeouts.current.delete(docId); }
  }

  function pollDocument(doc: Document, shipmentId?: string) {
    stopPolling(doc.id);

    const timer = setInterval(async () => {
      try {
        const { data: latest } = await documentsApi.get(doc.id);

        if (!PROCESSING_STATUSES.has(latest.status)) {
          stopPolling(doc.id);

          // Invalidate document and shipment queries so UI refreshes
          queryClient.invalidateQueries({ queryKey: queryKeys.document(doc.id) });
          if (shipmentId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.shipmentDetail(shipmentId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.shipmentMismatches(shipmentId) });
          }

          if (latest.status === 'classified' || latest.status === 'matched') {
            toast.success(`${latest.filename} — processing complete`);
          } else if (latest.status === 'needs_review') {
            toast.warning(`${latest.filename} — low confidence, please select document type`);
          } else if (latest.status === 'ocr_failed') {
            toast.error(`${latest.filename} — could not read file. Try again.`);
          }
        }
      } catch {
        // ignore transient errors; polling will stop on timeout
      }
    }, POLL_INTERVAL_MS);

    pollTimers.current.set(doc.id, timer);

    const timeout = setTimeout(() => {
      stopPolling(doc.id);
      toast.error(`${doc.filename} — processing timed out. Please re-upload.`);
    }, POLL_TIMEOUT_MS);

    pollTimeouts.current.set(doc.id, timeout);
  }

  async function upload(
    fileList: FileList | File[],
    uploadShipmentId?: string,
  ): Promise<Document[]> {
    const files = Array.from(fileList);
    const sid = uploadShipmentId ?? options?.shipmentId;

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
        ? await documentsApi.upload(files[0], sid).then((r) => ({ data: [r.data] }))
        : await documentsApi.uploadBatch(files, sid);

      // Invalidate document list and shipment
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      if (sid) {
        queryClient.invalidateQueries({ queryKey: queryKeys.shipmentDetail(sid) });
      }

      toast.success(
        data.length === 1
          ? 'Document uploaded — processing started'
          : `${data.length} documents uploaded — processing started`,
      );
      setProgress({ total: files.length, done: files.length, uploading: false, error: null });

      // Start per-document polling
      data.forEach((doc) => {
        if (PROCESSING_STATUSES.has(doc.status)) {
          pollDocument(doc, sid);
        }
      });

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
