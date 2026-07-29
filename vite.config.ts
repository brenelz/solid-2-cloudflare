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
      ssr: { external: true },
      serverFunctions: { configure: './src/server-config.ts' },
    }),
  ],
})
