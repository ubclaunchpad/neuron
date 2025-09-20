import type { SuperJSONValue } from "node_modules/superjson/dist/types";
import SuperJSON from "superjson";
import type { CacheClient } from "../db/cache";

type CacheableValue = SuperJSONValue;

export class CacheService {
  private readonly cacheClient: CacheClient;
  private singleObjectMemoryCache?: Map<string, string>; // key -> serialized string
  private groupObjectMemoryCache?: Map<string, Map<string, string>>; // group -> (key -> serialized string)

  constructor(cacheClient: CacheClient) {
    this.cacheClient = cacheClient;
  }

  async set<T extends CacheableValue>(key: string, value: T) {
    const strValue = this.serialize(value);

    // in-memory
    this.singleObjectMemoryCache = new Map();
    this.singleObjectMemoryCache.set(key, strValue);

    // redis
    await this.cacheClient.set(key, strValue);
  }

  async setSingleItemInGroup<T extends CacheableValue>(
    group: string,
    key: string,
    value: T,
  ) {
    const strValue = this.serialize(value);

    // per-request memory
    this.ensureGroupExistsInMemory(group);
    this.groupObjectMemoryCache?.get(group)?.set(key, strValue);

    // redis hash
    await this.cacheClient.hSet(group, key, strValue);
  }

  async setMultipleInGroup<T extends CacheableValue>(
    group: string,
    keys: string[],
    values: T[],
  ) {
    if (keys.length !== values.length) {
      throw new Error("keys.length must equal values.length");
    }

    this.ensureGroupExistsInMemory(group);

    const entries: Array<[string, string]> = keys.map((k, i) => {
      const s = this.serialize(values[i]);
      this.groupObjectMemoryCache?.get(group)?.set(k, s);
      return [k, s];
    });

    await Promise.all(
      entries.map(([k, v]) => this.cacheClient.hSet(group, k, v)),
    );
  }

  async get<T extends CacheableValue>(key: string): Promise<T | null> {
    // in-memory first
    const fromMem = this.singleObjectMemoryCache?.get(key);
    if (fromMem !== undefined) return this.deserialize<T>(fromMem);

    // redis && rehydrate memory
    const raw = await this.cacheClient.get(key);
    if (raw) {
      this.singleObjectMemoryCache ??= new Map();
      this.singleObjectMemoryCache.set(key, raw);
    }

    return this.deserialize<T>(raw);
  }

  async getSingleItemFromGroup<T extends CacheableValue>(
    group: string,
    key: string,
  ): Promise<T | null> {
    // Make sure the group exists in memory
    this.ensureGroupExistsInMemory(group);

    // in-memory first
    const inMemoryGroup = this.groupObjectMemoryCache?.get(group);
    const inMem = inMemoryGroup?.get(key);
    if (inMem !== undefined) return this.deserialize<T>(inMem);

    // redis && rehydrate memory
    const raw = await this.cacheClient.hGet(group, key);
    if (raw && inMemoryGroup) inMemoryGroup.set(key, raw);

    return this.deserialize<T>(raw);
  }

  async getMultipleFromGroup<T extends CacheableValue>(
    group: string,
    keys: string[],
  ): Promise<Array<T | null>> {
    // Make sure the group exists in memory
    this.ensureGroupExistsInMemory(group);

    const inMemoryGroup = this.groupObjectMemoryCache?.get(group);
    const serializedVals = new Array<string | null | undefined>(
      keys.length,
    );
    const missingRedisKeys: string[] = [];

    // check per-request cache first
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]!;
      if (inMemoryGroup?.has(k)) serializedVals[i] = inMemoryGroup.get(k)!;
      else missingRedisKeys.push(k);
    }

    // fetch the misses
    if (missingRedisKeys.length > 0) {
      const redisValues = await Promise.all(
        missingRedisKeys.map((k) => this.cacheClient.hGet(group, k)),
      );

      // merge back into the right slots; also hydrate memory
      let redisIndex = 0;
      for (let i = 0; i < keys.length; i++) {
        if (serializedVals[i] === undefined) {
          const raw = redisValues[redisIndex++] ?? null;
          serializedVals[i] = raw;

          if (raw && inMemoryGroup) inMemoryGroup.set(keys[i]!, raw);
        }
      }
    }

    // deserialize results
    return serializedVals.map((s) => this.deserialize<T>(s ?? null));
  }

  private async delete(key: string) {
    this.singleObjectMemoryCache?.delete(key);
    this.groupObjectMemoryCache?.delete(key);
    await this.cacheClient.del(key);
  }

  private async deleteSingleItemFromGroup(group: string, key: string) {
    await this.deleteMultipleItemsFromGroup(group, [key]);
  }

  private async deleteMultipleItemsFromGroup(group: string, keys: string[]) {
    const inMemoryGroup = this.groupObjectMemoryCache?.get(group);
    if (inMemoryGroup) {
      for (const k of keys) inMemoryGroup.delete(k);
    }

    await this.cacheClient.hDel(group, keys);
  }

  private ensureGroupExistsInMemory(group: string) {
    this.groupObjectMemoryCache ??= new Map();
    
    if (!this.groupObjectMemoryCache.has(group))
      this.groupObjectMemoryCache.set(group, new Map());
  }

  private serialize<T extends CacheableValue>(value: T): string {
    return SuperJSON.stringify(value);
  }

  private deserialize<T extends CacheableValue>(
    str: string | null | undefined,
  ): T | null {
    if (!str || str.length === 0) return null;
    return SuperJSON.parse(str);
  }
}
