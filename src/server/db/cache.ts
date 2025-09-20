import type { env as environment } from "@/env";
import { asFunction } from "awilix";
import { createClient, type RedisClientType } from "redis";
import type { NeuronContainer } from "../api/di-container";

export type CacheClient = RedisClientType;

export function registerCacheClient(container: NeuronContainer) {
  container.register({
    cacheClient: asFunction<CacheClient>(
      (env: typeof environment): CacheClient => {
        const g = globalThis as unknown as { __redis?: CacheClient };

        // Reuse the dev client across HMR updates
        if (g.__redis?.isOpen) return g.__redis;

        const client = g.__redis ?? createClient({ url: env.REDIS_URL });
        client.on("error", (err) => console.error("Redis Client Error", err));

        if (!client.isOpen) {
          void client.connect();
        }

        if (env.NODE_ENV !== "production") {
          g.__redis = client;
        }

        return client;
      },
    )
      .singleton()
      .disposer(async (client: CacheClient) => {
        // Avoid killing the dev-cached instance on HMR dispose
        const g = globalThis as unknown as { __redis?: CacheClient };
        if (g.__redis !== client) {
          try {
            await client.quit();
          } catch {
            /* ignore */
          }
        }
      }),
  });
}
