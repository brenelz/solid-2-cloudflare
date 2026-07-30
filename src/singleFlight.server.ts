/**
 * Single-flight mutations, server half.
 *
 * Re-runs the target location's data loading so this request's query cache
 * holds the post-mutation values, then resolves that cache into the payload the
 * client applies (see ./flight.ts).
 *
 * Only `warmQueriesFor` is host-specific; the hook above it is portable.
 */
import type { CollectFlightDataHook } from '@solidjs/web/server-functions/server'
import { provideRequestEvent } from '@solidjs/web/storage'
import { collectQueries } from './query.ts'
import type { QueryFlightData } from './flight.ts'

export const collectQueryFlightData: CollectFlightDataHook = (event, outcome) =>
    // The hook runs outside the request-event scope; re-establish it or the
    // per-request query cache has no event to hang on (and in-process server
    // function calls throw "Cannot call server function outside of a request").
    provideRequestEvent(event as Parameters<typeof provideRequestEvent>[0], async () => {
      if (outcome.thrown) return undefined;
      // Where the client will be once this settles: a redirect's target, else
      // the page it submitted from (same-origin fetches send a full Referer).
      const href =
        outcome.response?.headers.get("Location") ?? outcome.request.headers.get("referer");
      if (!href) return undefined;

      await warmQueriesFor(href, outcome);

      // Single-flight is the point: the response waits for the data.
      const queries: Record<string, unknown> = {};
      await Promise.all(
        Object.entries(collectQueries()).map(async ([key, promise]) => {
          try {
            queries[key] = await promise;
          } catch {
            // failed queries just aren't shipped; the client refetches on demand
          }
        })
      );
      return { href, queries } satisfies QueryFlightData;
    });

// --- host-specific ---------------------------------------------------------
// TanStack Router: build a router at that location and load it — the route
// loaders call our queries (`void someQuery()`), which warms the cache.
import { createMemoryHistory } from '@tanstack/solid-router'
import { createAppRouter } from './router.tsx'

async function warmQueriesFor(href: string, outcome: { request: Request }) {
    const origin = new URL(outcome.request.url).origin
    // memory history wants a router path, not an absolute URL — hand it an
    // absolute one and nothing matches, so no loader runs and nothing is warmed
    const url = new URL(href, origin)
    const router = createAppRouter()
    router.update({
        history: createMemoryHistory({ initialEntries: [url.pathname + url.search + url.hash] }),
        origin,
    })
    await router.load()
}
