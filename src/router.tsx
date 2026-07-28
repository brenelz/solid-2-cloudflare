import { createRouter } from '@tanstack/solid-router'
import { routeTree } from './routeTree.gen.ts'

export function createAppRouter() {
    return createRouter({
        routeTree,
        defaultPreload: 'intent',
        scrollRestoration: true,
    })
}

declare module '@tanstack/solid-router' {
    interface Register {
        router: ReturnType<typeof createAppRouter>
    }
}
