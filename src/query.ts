/**
 * `query()` — request-deduped, SSR-seeded async cache, ported from
 * @solidjs/router's `query()` (next branch) to Solid 2 + TanStack Router.
 *
 * Deviations from solid-router:
 * - SSR -> client seeding rides TanStack Router's `dehydrate`/`hydrate`
 *   options (`collectQueries`/`seedQueries`) instead of sharedConfig
 *   serialization.
 * - Server functions are declared GET via transport metadata (this stack's
 *   compiled references don't carry a `.GET` property).
 * - No routing intent/preload integration, and no Response/redirect
 *   handling yet (TODO).
 */
import { createSignal, getObserver, onCleanup } from "solid-js";
import { getRequestEvent, isServer } from "@solidjs/web";
// Bare specifier on purpose: the '/client' and '/server' subpaths are
// separate module instances under Vite's optimizer.
import {
  GET,
  getServerFunctionMetadata,
  isServerFunction,
} from "@solidjs/web/server-functions";

const PRELOAD_TIMEOUT = 5000;
const CACHE_TIMEOUT = 180000;
// [ts, promise, value, versionSignal] — solid-router's layout minus the
// intent slot. ts === 0 marks an invalidated entry.
type CacheEntry = [number, any, any, [() => number, (v: number) => void] & { count: number }];
let cacheMap = new Map<string, CacheEntry>();

// cleanup forward/back cache
if (!isServer) {
  setInterval(() => {
    const now = Date.now();
    for (let [k, v] of cacheMap.entries()) {
      if (!v[3].count && now - v[0] > CACHE_TIMEOUT) {
        cacheMap.delete(k);
      }
    }
  }, 300000);
}

function getCache() {
  if (!isServer) return cacheMap;
  const req = getRequestEvent();
  if (!req) throw new Error("Cannot find cache context");
  return (req.locals.queryCache ||
    (req.locals.queryCache = new Map())) as Map<string, CacheEntry>;
}

/**
 * Revalidates the given cache entry/entries (prefix match; omit to
 * revalidate everything).
 */
export function revalidate(key?: string | string[] | void, force = true) {
  force && cacheKeyOp(key, entry => (entry[0] = 0));
  cacheKeyOp(key, entry => entry[3][1](Date.now())); // retrigger live signals
}

export function cacheKeyOp(key: string | string[] | void, fn: (entry: CacheEntry) => void) {
  key && !Array.isArray(key) && (key = [key]);
  const cache = getCache();
  for (let k of cache.keys()) {
    if (key === undefined || matchKey(k, key as string[])) fn(cache.get(k)!);
  }
}

export type CachedFunction<T extends (...args: any) => any> = T & {
  keyFor: (...args: Parameters<T>) => string;
  key: string;
};

function createEntry(ts: number, res: any): CacheEntry {
  const entry: CacheEntry = [ts, res, undefined, createSignal(ts) as any];
  entry[3].count = 0;
  res && typeof res.then === "function"
    ? res.then((v: any) => entry[1] === res && (entry[2] = v), () => {})
    : (entry[2] = res);
  return entry;
}

export function query<T extends (...args: any) => any>(fn: T, name: string): CachedFunction<T> {
  // a query is a read: declare server functions GET (keeps them cacheable
  // and off the single-flight path, which only opts in non-GET calls)
  if (isServerFunction(fn) && getServerFunctionMetadata(fn)?.method !== "GET")
    fn = GET(fn) as unknown as T;
  const cachedFn = ((...args: Parameters<T>) => {
    const cache = getCache();
    const now = Date.now();
    const key = name + hashKey(args);
    let cached = cache.get(key);
    let tracking;
    if (getObserver() && !isServer) {
      tracking = true;
      onCleanup(() => cached![3].count--);
    }

    if (
      cached &&
      cached[0] &&
      (isServer || cached[3].count || now - cached[0] < PRELOAD_TIMEOUT)
    ) {
      if (tracking) {
        cached[3].count++;
        cached[3][0](); // track
      }
      return cached[1];
    }

    const res = fn(...(args as any));
    if (cached) {
      cached[0] = now;
      cached[1] = res;
      res && typeof res.then === "function"
        ? res.then((v: any) => cached![1] === res && (cached![2] = v), () => {})
        : (cached[2] = res);
    } else {
      cache.set(key, (cached = createEntry(now, res)));
    }
    if (tracking) {
      cached[3].count++;
      cached[3][0](); // track
    }
    return res;
  }) as unknown as CachedFunction<T>;
  cachedFn.keyFor = (...args: Parameters<T>) => name + hashKey(args);
  cachedFn.key = name;
  return cachedFn;
}

query.get = (key: string) => getCache().get(key)?.[2];

query.set = <T>(key: string, value: T extends Promise<any> ? never : T) => {
  const cache = getCache();
  const now = Date.now();
  let cached = cache.get(key);
  if (cached) {
    cached[0] = now;
    cached[1] = Promise.resolve(value);
    cached[2] = value;
    cached[3][1](now); // notify observers
  } else {
    cache.set(key, (cached = createEntry(now, Promise.resolve(value))));
    cached[2] = value;
  }
};

query.delete = (key: string) => getCache().delete(key);

query.clear = () => getCache().clear();

/**
 * Server-only: snapshot the per-request cache's promises (NOT awaited —
 * TanStack streams promise resolutions via seroval). Wire into the router:
 * `dehydrate: () => ({ queries: collectQueries() })`. Runs after loaders,
 * before render — only loader-warmed queries are captured.
 */
export function collectQueries(): Record<string, Promise<any>> {
  const queries: Record<string, Promise<any>> = {};
  if (!isServer) return queries;
  for (const [k, entry] of getCache()) queries[k] = entry[1];
  return queries;
}

/**
 * Client-only: install server-collected promises before hydration renders.
 * Wire into the router: `hydrate: (data) => { seedQueries(data?.queries) }`.
 */
export function seedQueries(queries?: Record<string, unknown>) {
  if (isServer || !queries) return;
  for (const [key, res] of Object.entries(queries)) {
    if (!cacheMap.has(key)) cacheMap.set(key, createEntry(Date.now(), res));
  }
}

function matchKey(key: string, keys: string[]) {
  for (let k of keys) {
    if (k && key.startsWith(k)) return true;
  }
  return false;
}

// Modified from the amazing TanStack Query library (MIT)
// https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L168
export function hashKey<T extends Array<any>>(args: T): string {
  return JSON.stringify(args, (_, val) =>
    isPlainObject(val)
      ? Object.keys(val)
          .sort()
          .reduce((result, key) => {
            result[key] = val[key];
            return result;
          }, {} as any)
      : val
  );
}

function isPlainObject(obj: object) {
  let proto;
  return (
    obj != null &&
    typeof obj === "object" &&
    (!(proto = Object.getPrototypeOf(obj)) || proto === Object.prototype)
  );
}
