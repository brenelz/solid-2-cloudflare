import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig(({ command }) => ({
  plugins: [
    cloudflare({
      // Solid's dev middleware needs Vite's runnable default SSR environment.
      viteEnvironment: command === 'build' ? { name: 'ssr' } : undefined,
    }),
    solid({ ssr: {}, serverFunctions: true }),
  ],
}))
