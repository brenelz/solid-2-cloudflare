/* @refresh reload */
import { RouterProvider } from '@tanstack/solid-router'
import { hydrate as hydrateRouter } from '@tanstack/router-core/ssr/client'
import { hydrate } from '@solidjs/web'
import { createAppRouter } from './router.tsx'
import { installServerComponents } from '@solidjs/web/frames'

const router = createAppRouter()

await hydrateRouter(router)

installServerComponents();

hydrate(() => <RouterProvider router={router} />, document)
