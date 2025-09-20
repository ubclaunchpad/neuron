
// interface EntityWithId<TId> {
//   GetEntityId(): TId;
// }

// export abstract class CacheableEntityService<TEntity extends EntityWithId<TId>, TRequest extends ListRequest, TId extends string | number> {
//   private readonly db: Drizzle;
//   private readonly cacheService: CacheService;

//   protected abstract groupKeyForSingleEntities: string;
//   protected abstract groupKeyForListOfEntityIds: string;

//   protected abstract getIdsForListRequest(request: TRequest, shouldFetchCount: boolean): Promise<TId[]>;
//   protected abstract retrieveFromDatabase(ids: TId[]): Promise<TEntity[]>;

//   constructor(db: Drizzle, cacheService: CacheService) {
//     this.db = db;
//     this.cacheService = cacheService;
//   }

//   protected async getByRequest(request: TRequest): Promise<ListResponse<TEntity>> {

//   }

//   protected async getIds(ids: TId[]): Promise<TEntity[]> {
//     const groupCacheKey = this.groupKeyForSingleEntities;

//     //Trim the list down to ones that aren't already in the cache. keep a dictionary of missing entries in the list
//     const allEntities = await this.cacheService.GetMultipleFromGroup<TEntity>(groupCacheKey, ids.map(id => id.toString()));

//     const missingEntityIndexes = new Map<TId, number>();
//     for (let i = 0; i < ids.length; i++)
//     {
//         if (allEntities[i] == null)
//         {
//             missingEntityIndexes.set(ids[i]!, i);
//         }
//     }

//     // Fetch the database version of the missing objects and cache them in the single cache
//     if (missingEntityIndexes.size > 0)
//     {
//       const entities = await this.retrieveFromDatabase(Array.from(missingEntityIndexes.keys()));

//       const entityCacheKeys = new Array<string>();
//       for (const entity of entities)
//       {
//           const entityId = entity.GetEntityId();
//           entityCacheKeys.push(entityId.toString());

//           allEntities[missingEntityIndexes.get(entityId)!] = entity;
//       }

//       await this.cacheService.SetMultipleInGroup(groupCacheKey, entityCacheKeys, entities);
//     }

//     return allEntities.filter((x): x is TEntity => x != null);
//   }

//   protected async getById(id: TId): Promise<TEntity> {
//     return (await this.getIds([id]))[0]!;
//   }

//   private async fetchIdsFromCache(request: TRequest): Promise<TEntity[] | null> {
//     return await this.cacheService.getSingleItemFromGroup<TEntity[]>(
//       this.groupKeyForListOfEntityIds,
//       request.ListCacheKey
//     );
//   }

//   private async fetchCountFromCache(request: TRequest): Promise<number | null> {
//     return await this.cacheService.getSingleItemFromGroup<number>(
//       this.groupKeyForListOfEntityIds,
//       request.CountCacheKey
//     );
//   }
// }

// /**
//  * T is the type of entities stored in the cache (for lists, usually IDs).
//  * V is the type of entities returned by the list response (the complete entity model).
//  */
// class CacheHelper<T, V> {
//   private readonly groupKeyForListOfEntityIds: string;
//   private readonly cacheService: ICacheService;

//   constructor(groupKeyForListOfEntityIds: string, cacheService: ICacheService) {
//     this.groupKeyForListOfEntityIds = groupKeyForListOfEntityIds;
//     this.cacheService = cacheService;
//   }

//   /**
//    * Returns a list response, handling reading and writing to the cache based on the ListRequest.
//    *
//    * @param request List request from the frontend
//    * @param getTs A function that returns the IDs of the entities if the IDs for this ListRequest
//    *              do not already exist in the cache. It receives a boolean that indicates whether
//    *              the count should be fetched.
//    * @param buildVsFromTs A function that builds a list of entities from their IDs
//    */
//   async getByRequest(
//     request: ListRequest,
//     getTs: (shouldFetchCount: boolean) => Promise<ListResponse<T>>,
//     buildVsFromTs: (ids: T[]) => Promise<V[]>
//   ): Promise<ListResponse<V>> {
//     // Check the cache for the presence of the count and the IDs
//     let allTs = await this.fetchTsFromCache(request);
//     let count = await this.fetchCountFromCache(request);

//     // Always fetch the count if it wasn't returned (or zero), and never fetch it if retrieving specific IDs
//     const shouldFetchCount = !Number.isFinite(count) || (count ?? 0) === 0;

//     if (allTs == null || shouldFetchCount) {
//       const newTs = await getTs(shouldFetchCount);
//       allTs = newTs.Data;

//       // Only cache the results for this query if we did not get them out of the cache
//       if (request.ShouldCacheResults()) {
//         await this.cacheService.setSingleItemInGroup<T[]>(
//           this.groupKeyForListOfEntityIds,
//           request.ListCacheKey,
//           allTs
//         );
//       }

//       // Only set the count if it was fetched, otherwise we'd overwrite a legit value
//       if (shouldFetchCount) {
//         count = newTs.TotalRecords;
//         if (request.ShouldCacheCount()) {
//           await this.cacheService.setSingleItemInGroup<number>(
//             this.groupKeyForListOfEntityIds,
//             request.CountCacheKey,
//             count
//           );
//         }
//       }
//     }

//     // Build the list of entities based on the IDs from the ListRequest
//     const listOfVs = await buildVsFromTs(allTs);
//     const response = new ListResponse<V>(count ?? 0, listOfVs);

//     // Filter entities that do not exist (null/undefined) to mirror RemoveAll(entity == null)
//     const filtered = response.Data.filter((e) => e != null);
//     if (filtered.length !== response.Data.length) {
//       response.Data = filtered;
//       response.TotalRecords = filtered.length;
//     }

//     return response;
//   }

//   // ------- private helpers -------

//   private async fetchTsFromCache(request: ListRequest): Promise<T[] | null> {
//     if (!request.ShouldCacheResults()) {
//       return null;
//     }
//     return await this.cacheService.getSingleItemFromGroup<T[]>(
//       this.groupKeyForListOfEntityIds,
//       request.ListCacheKey
//     );
//   }

//   private async fetchCountFromCache(request: ListRequest): Promise<number | null> {
//     if (!request.ShouldCacheCount()) {
//       return null;
//     }
//     return await this.cacheService.getSingleItemFromGroup<number>(
//       this.groupKeyForListOfEntityIds,
//       request.CountCacheKey
//     );
//   }
// }