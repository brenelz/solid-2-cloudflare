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

export const getAboutPage = query(async function () {
    "use server";
    const id = 5;
    return (props: { button: any }) => (
        <section class="page" >
            <p class="eyebrow" > Route / about </p>
            < h1 > About </h1>
            < p class="lede" > This app renders the whole document on the server, streams async boundaries, then hydrates into a client - side router.</p>
            <props.button id={id} />
        </section>
    )
}, 'getAboutPage');