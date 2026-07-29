/* @refresh reload */
import {
    RouterServer,
    createRequestHandler,
    renderRouterToStream,
} from '@tanstack/solid-router/ssr/server'
import manifest from 'virtual:solid-manifest'
import { getRequestEvent } from '@solidjs/web'
import { createAppRouter } from './router.tsx'

export function render(request: Request, context: { clientEntry?: string }) {
    // The handler's literal-rewrite only covers HTML/stream results, not the
    // Response the router returns — surface its resolved entry to the root
    // document's <script> instead.
    const event = getRequestEvent()
    if (event && context.clientEntry) event.locals.clientEntry = context.clientEntry

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
}
