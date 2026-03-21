import { usePublicConfig, type PublicConfig } from "@/lib/public-config";

export function buildImageUrl(
  config: PublicConfig,
  image: string | null | undefined,
): string | undefined {
  if (!image) return undefined;
  return `${config.filesBaseUrl}/${config.filesBucket}/${image}`;
}

export function useImageUrl(
  image: string | null | undefined,
): string | undefined {
  const config = usePublicConfig();
  if (!config || !image) return undefined;
  return `${config.filesBaseUrl}/${config.filesBucket}/${image}`;
}
