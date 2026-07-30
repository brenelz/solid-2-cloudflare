import { createRouter } from '@tanstack/solid-router'
import { routeTree } from './routeTree.gen.ts'
import { collectQueries, seedQueries } from './query.ts'

interface DehydratedQueries {
    // Promise values are supported: TanStack serializes dehydrated data with
    // seroval's crossSerializeStream, which streams promise resolutions to
    // the client.
    queries: Record<string, Promise<any>>
}

export function createAppRouter() {
    return createRouter({
        routeTree,
        defaultPreload: 'intent',
        scrollRestoration: true,
        // Server-only: runs after router.load() (loaders have executed, the
        // per-request query cache is warm) and before the component stream
        // renders. The promises are not awaited — seroval streams them.
        dehydrate: (): DehydratedQueries => ({ queries: collectQueries() }),
        // Client-only: runs before component hydration, so the first
        // client-side query call reuses the server promise instead of
        // refetching. Do not await the revived promises here.
        hydrate: (data: DehydratedQueries) => {
            seedQueries(data?.queries)
        },
    })
}

declare module '@tanstack/solid-router' {
    interface Register {
        router: ReturnType<typeof createAppRouter>
    }
}
