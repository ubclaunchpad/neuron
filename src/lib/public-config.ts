import { useEffect, useState } from "react";

export interface PublicConfig {
  filesBaseUrl: string;
  filesBucket: string;
}

let cached: PublicConfig | null = null;
let inflight: Promise<PublicConfig> | null = null;

export async function getPublicConfig(): Promise<PublicConfig> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = fetch("/api/public-config")
    .then(async (res) => {
      if (!res.ok) throw new Error("Failed to fetch public config");
      const data = (await res.json()) as PublicConfig;
      cached = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function usePublicConfig(): PublicConfig | null {
  const [config, setConfig] = useState<PublicConfig | null>(cached);

  useEffect(() => {
    if (cached) {
      setConfig(cached);
      return;
    }
    void getPublicConfig().then(setConfig);
  }, []);

  return config;
}
