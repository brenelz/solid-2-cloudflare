import { GET } from "@solidjs/web/server-functions"

export const hello = GET(async function () {
    'use server'
    console.log('on server')
    await new Promise(resolve => setTimeout(resolve, 1000))
    return 'Hello World'
});