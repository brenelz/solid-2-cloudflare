import { createMemoryHistory } from '@tanstack/solid-router'
import type { CollectFlightDataHook } from '@solidjs/web/server-functions/server'
import { createAppRouter } from './router.tsx'
import { collectQueries, query, revalidate } from './query.ts'

export const LOCATION_HEADER = 'X-Router-Location'

export interface RouterFlightData {
    href: string
    /** Post-mutation query results, resolved on the server: key -> value. */
    queries: Record<string, unknown>
}

export const collectRouterFlightData: CollectFlightDataHook = async (_event, outcome) => {
    if (outcome.thrown) return undefined
    const href =
        outcome.response?.headers.get('Location') ??
        outcome.request.headers.get(LOCATION_HEADER)
    if (!href) return undefined

    // Re-run the route's loaders against the post-mutation state; they warm
    // this request's query cache (loaders call `void someQuery()`).
    const router = createAppRouter()
    router.update({
        history: createMemoryHistory({ initialEntries: [href] }),
        origin: new URL(outcome.request.url).origin,
    })
    await router.load()

    // Single-flight is the point: the response waits for the data.
    const queries: Record<string, unknown> = {}
    await Promise.all(
        Object.entries(collectQueries()).map(async ([key, promise]) => {
            try {
                queries[key] = await promise
            } catch {
                // failed queries just aren't shipped; the client refetches on demand
            }
        }),
    )
    return { href, queries } satisfies RouterFlightData
}

export function applyRouterFlightData(
    router: ReturnType<typeof createAppRouter>,
    data: RouterFlightData,
) {
    // The payload describes the location the mutation ran against; if the
    // user navigated (or the mutation redirected) while it was in flight,
    // seeding would write another page's data — refetch instead.
    if (data.href !== router.state.location.href) return revalidate()

    // `query.set` bumps each entry's version signal, so memos reading the
    // query re-run with the fresh value — no client refetch.
    for (const [key, value] of Object.entries(data.queries)) {
        query.set(key, value)
    }
}
