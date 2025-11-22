// src/lib/avatar.ts

import { env } from "@/env";

export function getImageUrlFromKey(image: string | null | undefined): string | undefined {
    if (!image) return undefined;
    
    const rawBase = env.NEXT_PUBLIC_FILES_BASE_URL;
    const bucket = env.NEXT_PUBLIC_FILES_BUCKET ?? "neuron";
  
    return `${rawBase}/${bucket}/${image}`;
}
  