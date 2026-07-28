import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig(({ command }) => ({
  environments: {
    solid_2_cloudflare: {
      optimizeDeps: {
        exclude: ['@tanstack/solid-router'],
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
    ssr: {
      build: {
        rollupOptions: {
          input: './src/entry-server.tsx',
        },
      },
    },
  },
  plugins: [
    tanstackRouter({
      target: 'solid',
      autoCodeSplitting: true
    }),
    {
      name: 'build-client-manifest-first',
      apply: 'build',
      buildApp: {
        order: 'pre',
        async handler(builder) {
          await builder.build(builder.environments.client)
        },
      },
    },
    cloudflare({
      // Solid's dev middleware needs Vite's runnable default SSR environment.
      viteEnvironment: command === 'build' ? { name: 'ssr' } : undefined,
    }),
    solid({ ssr: true, serverFunctions: true }),
  ],
}))
