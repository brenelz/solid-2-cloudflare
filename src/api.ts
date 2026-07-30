import { respond } from "@solidjs/web";
import { query } from "./query.ts";
import { action } from "./action.ts";

let global = 'Hello World';

export const hello = query(async function () {
    'use server'
    console.log('on server')
    await new Promise(resolve => setTimeout(resolve, 1000))
    return global;
}, 'hello');

export const changeText = action(async function () {
    'use server'
    global = global + '!';

    return respond({ ok: true });
});