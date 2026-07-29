import { respond } from "@solidjs/web";
import { GET } from "@solidjs/web/server-functions"

let global = 'Hello World';

export const hello = GET(async function () {
    'use server'
    console.log('on server')
    await new Promise(resolve => setTimeout(resolve, 1000))
    return global;
});

export const changeText = async function () {
    'use server'
    global = 'Hello World 2';

    return respond({ ok: true });
};