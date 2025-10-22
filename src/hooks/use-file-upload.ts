import { useCallback, useRef, useState } from "react";

export type UploadState =
  | { phase: "idle" }
  | { phase: "signing" }
  | { phase: "uploading"; progress: number }
  | { phase: "updating" }
  | { phase: "done"; key: string }
  | { phase: "error"; error: Error };

export type GetPresignedUrlResult = {
  url: string;
  key: string; // object key within bucket
  contentType?: string;
  headers?: Record<string, string>;
};

export type GetPresignedUrlFn = (file: File) => Promise<GetPresignedUrlResult>;

export type UploadFn = (args: {
  file: File;
  data?: Blob; // optional processed data; defaults to file
  contentType?: string; // override content-type for upload
}) => Promise<string>;

export type AbortFn = () => void;
export type ResetFn = () => void;

export function useFileUpload(strategy: {
  getPresignedUrl: GetPresignedUrlFn;
  validateFile?: (file: File) => void;
}): { state: UploadState; upload: UploadFn; abort: AbortFn; reset: ResetFn } {
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const abort = useCallback(() => {
    try {
      xhrRef.current?.abort();
    } finally {
      xhrRef.current = null;
      setState({ phase: "idle" });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ phase: "idle" });
  }, []);

  const upload: UploadFn = useCallback(
    async ({ file, data, contentType }) => {
      try {
        strategy.validateFile?.(file);

        setState({ phase: "signing" });
        const { url, key, contentType: signedType, headers } = await strategy.getPresignedUrl(file);

        const body = data ?? file;
        const type = contentType ?? signedType ?? (body instanceof File ? body.type : undefined) ?? "application/octet-stream";

        setState({ phase: "uploading", progress: 0 });

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;
          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const progress = Math.min(100, Math.round((evt.loaded / evt.total) * 100));
              setState({ phase: "uploading", progress });
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.onabort = () => reject(new Error("Upload aborted"));

          xhr.open("PUT", url, true);
          xhr.setRequestHeader("Content-Type", type);
          if (headers) {
            for (const [k, v] of Object.entries(headers)) {
              xhr.setRequestHeader(k, v);
            }
          }
          xhr.send(body);
        });

        setState({ phase: "done", key });
        return key;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setState({ phase: "error", error });
        throw error;
      } finally {
        xhrRef.current = null;
      }
    },
    [strategy],
  );

  return { state, upload, abort, reset };
}


