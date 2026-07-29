/* @refresh reload */
import { RouterProvider } from '@tanstack/solid-router'
import { hydrate as hydrateRouter } from '@tanstack/router-core/ssr/client'
import { hydrate } from '@solidjs/web'
// Must be the bare specifier: the compiled server-function references import
// '@solidjs/web/server-functions', and Vite's dep optimizer gives each
// specifier its own module instance — '/client' would register the consumer
// in a copy the transport never reads.
import {
    configureServerFunctionsClient,
    subscribeFlightData,
} from '@solidjs/web/server-functions'
import { createAppRouter } from './router.tsx'
import {
    LOCATION_HEADER,
    applyRouterFlightData,
    type RouterFlightData,
} from './singleFlight.ts'

const router = createAppRouter()

configureServerFunctionsClient({
    prepareRequest(init) {
        const headers = new Headers(init.headers)
        headers.set(LOCATION_HEADER, router.state.location.href)
        return { ...init, headers }
    },
})

subscribeFlightData<RouterFlightData>((data) => applyRouterFlightData(router, data))

await hydrateRouter(router)

hydrate(() => <RouterProvider router={router} />, document)
