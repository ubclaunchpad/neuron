import { useCallback, useRef, useState } from "react";

export type UploadState =
  | { phase: "idle" }
  | { phase: "signing" }
  | { phase: "uploading"; progress: number }
  | { phase: "updating" }
  | { phase: "error"; error: Error };

export type GetPresignedUrlResult = {
  url: string;
  key: string; // object key within bucket
  contentType?: string;
  headers?: Record<string, string>;
};

export type UploadFnArgs = {
  file?: File;
  data?: Blob; // optional processed data; defaults to file
  contentType?: string; // override content-type for upload
}

export type UploadFn = (args: UploadFnArgs) => Promise<string>;
export type GetPresignedUrlFn = (args: UploadFnArgs) => Promise<GetPresignedUrlResult>;
export type AbortFn = () => void;
export type ResetFn = () => void;

export type UseFileUploadOptions = {
  getPresignedUrl: GetPresignedUrlFn;
  // Can throw if the file is invalid
  validateFile?: (args: UploadFnArgs) => void;
  // Called when the upload finishes successfully
  onSuccess?: (key: string) => void;
  // Called when the upload fails (excluding controlled aborts)
  onError?: (error: Error) => void;
};

/**
 * Hook to upload a file (or processed Blob) via a presigned URL.
 * Handles progress, errors, and aborting via an underlying XMLHttpRequest.
 */
export function useFileUpload({
  getPresignedUrl,
  validateFile,
  onSuccess,
  onError,
}: UseFileUploadOptions): {
  state: UploadState;
  upload: UploadFn;
  abort: AbortFn;
} {
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // Track whether the caller explicitly aborted, so we can treat that
  // differently from a "real" error.
  const abortedRef = useRef(false);

  const abort = useCallback(() => {
    if (!xhrRef.current) return;

    abortedRef.current = true;
    try {
      xhrRef.current.abort();
    } finally {
      xhrRef.current = null;
      // From the consumer’s perspective, abort = "nothing happening now"
      setState({ phase: "idle" });
    }
  }, []);

  const upload: UploadFn = useCallback(
    async (args) => {
      const { file, data, contentType } = args;
      abortedRef.current = false;

      try {
        // Let the caller enforce size/type/etc rules.
        validateFile?.(args);

        // If we passed a processed Blob (e.g. cropped image), use that.
        const body = data ?? file;
        if (!body) {
          throw new Error("No file or blob provided for upload");
        }

        setState({ phase: "signing" });

        const {
          url,
          key,
          contentType: signedType,
          headers,
        } = await getPresignedUrl(args);

        // Content-type resolution order:
        // 1. explicit override from caller
        // 2. type suggested by the signing endpoint
        // 3. the File's own type (if body is a File)
        // 4. safe default
        const type =
          contentType ??
          signedType ??
          (body instanceof File ? body.type : undefined) ??
          "application/octet-stream";

        setState({ phase: "uploading", progress: 0 });

        console.log("url", url);
        console.log("key", key);
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          // Update progress if the server tells us the total size.
          xhr.upload.onprogress = (evt) => {
            if (!evt.lengthComputable) return;

            const progress = Math.min(
              100,
              Math.round((evt.loaded / evt.total) * 100),
            );
            setState({ phase: "uploading", progress });
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(
                new Error(`Upload failed with status ${xhr.status}`),
              );
            }
          };

          xhr.onerror = () => {
            reject(new Error("Network error during upload"));
          };

          xhr.onabort = () => {
            // This will be triggered both for user-initiated aborts
            // and e.g. page navigation; we distinguish via abortedRef.
            reject(new Error("Upload aborted"));
          };

          xhr.open("PUT", url, true);
          xhr.setRequestHeader("Content-Type", type);

          if (headers) {
            for (const [k, v] of Object.entries(headers)) {
              xhr.setRequestHeader(k, v);
            }
          }

          xhr.send(body);
        });

        // If the caller aborted after we started, don't flip to "done"
        // or call success handlers.
        if (abortedRef.current) {
          return key;
        }

        setState({ phase: "idle" });
        onSuccess?.(key);

        console.log(key);
        return key;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Upload failed");

        // If this was a controlled abort, we already set state to "idle"
        // in abort() and we don't want to show an error UI.
        if (abortedRef.current) {
          throw error;
        }

        setState({ phase: "error", error });
        onError?.(error);
        throw error;
      } finally {
        xhrRef.current = null;
      }
    },
    [getPresignedUrl, validateFile, onError, onSuccess],
  );

  return { state, upload, abort };
}
