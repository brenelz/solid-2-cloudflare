import { createMemoryHistory } from '@tanstack/solid-router'
import type { CollectFlightDataHook } from '@solidjs/web/server-functions/server'
import { createAppRouter } from './router.tsx'

export const LOCATION_HEADER = 'X-Router-Location'

export interface RouterFlightData {
    href: string
    matches: Array<{ id: string; loaderData: unknown; updatedAt: number }>
}

export const collectRouterFlightData: CollectFlightDataHook = async (_event, outcome) => {
    if (outcome.thrown) return undefined
    const href =
        outcome.response?.headers.get('Location') ??
        outcome.request.headers.get(LOCATION_HEADER)
    if (!href) return undefined

    const router = createAppRouter()
    router.update({
        history: createMemoryHistory({ initialEntries: [href] }),
        origin: new URL(outcome.request.url).origin,
    })
    await router.load()

    const matches = router.state.matches
        .filter((match) => match.status === 'success')
        .map((match) => ({
            id: match.id,
            loaderData: match.loaderData as unknown,
            updatedAt: match.updatedAt,
        }))
    return { href, matches } satisfies RouterFlightData
}

export function applyRouterFlightData(
    router: ReturnType<typeof createAppRouter>,
    data: RouterFlightData,
) {
    // The payload describes the location the mutation ran against; if the
    // user navigated (or the mutation redirected) while it was in flight,
    // seeding would write another page's data — refetch instead.
    if (data.href !== router.state.location.href) return router.invalidate()

    let applied = false
    for (const match of data.matches) {
        if (!router.getMatch(match.id)) continue
        applied = true
        router.updateMatch(match.id, (prev) => ({
            ...prev,
            loaderData: match.loaderData,
            updatedAt: match.updatedAt,
            invalid: false,
            status: 'success' as const,
            error: undefined,
        }))
    }
    if (!applied) return router.invalidate()
}
