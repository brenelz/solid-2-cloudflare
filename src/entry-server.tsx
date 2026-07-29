/* @refresh reload */
import {
    RouterServer,
    createRequestHandler,
    renderRouterToStream,
} from '@tanstack/solid-router/ssr/server'
import { provideRequestEvent } from '@solidjs/web/storage'
import manifest from 'virtual:solid-manifest'
import {
    endpoint,
    handleServerFunctionRequest,
} from 'virtual:solid-server-function-handler'
import { createAppRouter } from './router.tsx'
import { collectRouterFlightData } from './singleFlight.ts'
import type { ServerFunctionEvent, ServerFunctionOutcome } from '@solidjs/web/server-functions/server'

const clientEntry = import.meta.env.DEV
    ? '/src/entry-client.tsx'
    : `${manifest._base ?? '/'}${manifest['src/entry-client.tsx'].file}`

export default {
    fetch(request: Request) {
        if (new URL(request.url).pathname === endpoint) {
            return handleServerFunctionRequest(request, {
                // The handler runs this hook outside its provideEvent scope,
                // so the event is re-provided for the loaders' in-process
                // server function calls.
                collectFlightData: (event: ServerFunctionEvent, outcome: ServerFunctionOutcome) =>
                    provideRequestEvent(event, () => collectRouterFlightData(event, outcome)),
            })
        }

        return provideRequestEvent({ request, locals: { clientEntry } }, () => {
            const handler = createRequestHandler({
                request,
                createRouter: createAppRouter
            })

            return handler(({ request, responseHeaders, router }) => {
                responseHeaders.set('content-type', 'text/html; charset=utf-8')
                return renderRouterToStream({
                    request,
                    responseHeaders,
                    router,
                    manifest,
                    children: () => <RouterServer router={router} />,
                })
            })
        })
    },
}
