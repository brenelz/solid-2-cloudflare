/// <reference types="vite/client" />

declare module 'virtual:solid-ssr-handler' {
  export function handleRequest(request: Request): Promise<Response>
}
