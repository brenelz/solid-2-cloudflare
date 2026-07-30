/* @refresh reload */
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/solid-router'
import { HydrationScript, NoHydration, getRequestEvent, type JSX } from '@solidjs/web'

import appCss from '../App.css?url'
import { installQueryFlightConsumer } from '../flight.ts'

installQueryFlightConsumer()

export const Route = createRootRoute({
  component: Layout,
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
  head: () => ({
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
})

function RootDocument(props: { children: JSX.Element }) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Solid SSR Lab</title>
        <HydrationScript />
        <HeadContent />
      </head>
      <body>
        <div id="root">{props.children}</div>
        <Scripts />
        <NoHydration>
          <script
            type="module"
            src={getRequestEvent()?.locals.clientEntry ?? '/src/entry-client.tsx'}
            async
          ></script>
        </NoHydration>
      </body>
    </html >
  )
}

function Layout() {
  return (
    <main class="site-shell">
      <header class="site-header">
        <Link class="brand" to="/">Solid / SSR</Link>
        <nav aria-label="Primary navigation">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ class: 'active' }}>Home</Link>
          <Link to="/about" activeProps={{ class: 'active' }}>About</Link>
        </nav>
      </header>
      <div class="route-stage"><Outlet /></div>
      <footer>
        <span>Solid 2</span>
        <span>Streaming enabled</span>
      </footer>
    </main>
  )
}

function NotFound() {
  return (
    <section class="page">
      <p class="eyebrow">404</p>
      <h1>Not Found</h1>
      <p class="lede">That route does not exist.</p>
    </section>
  )
}
