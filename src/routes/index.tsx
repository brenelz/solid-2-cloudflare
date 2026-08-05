import { createFileRoute } from '@tanstack/solid-router'
import { createMemo, Loading } from 'solid-js'
import { changeText, hello } from '../api'

export const Route = createFileRoute('/')({
  loader: () => {
    void hello();
  },
  component: Home,
})

function Home() {
  const message = createMemo(() => hello())

  return (
    <section class="page">
      <p class="eyebrow">Route /</p>
      <h1>Home</h1>
      <p class="lede">A small Solid 2 playground for streamed SSR, server functions, and routing.</p>
      <div class="server-result" aria-live="polite">
        <span class="result-label">Server response</span>
        <Loading fallback={<p class="loading"><span class="loading-dot" />Loading...</p>}>
          <p class="result-value">{message()}</p>
        </Loading>
        <form action={changeText} method="post">
          <button class="change-text-button" type="submit">change text</button>
        </form>
      </div>
    </section>
  )
}
