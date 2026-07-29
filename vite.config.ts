import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  environments: {
    ssr: {
      optimizeDeps: {
        exclude: ['@tanstack/solid-router'],
      },
      build: {
        rollupOptions: {
          input: './src/entry-server.tsx',
        },
      },
    },
    client: {
      build: {
        manifest: true,
        rollupOptions: {
          input: './src/entry-client.tsx',
        },
      },
    },
  },
  plugins: [
    tanstackRouter({
      target: 'solid',
      autoCodeSplitting: true
    }),
    cloudflare({
      viteEnvironment: { name: 'ssr' },
    }),
    solid({
      ssr: true,
      // devMiddleware off: /_server falls through to the worker in dev, so
      // server functions run in workerd with the same module state as page
      // SSR (the plugin's middleware would run them in Vite's node SSR
      // environment instead).
      serverFunctions: { devMiddleware: false },
    }),
  ],
})
