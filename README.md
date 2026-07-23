## Usage

```bash
pnpm install
```

### Learn more on the [Solid Website](https://solidjs.com) and come chat with us on our [Discord](https://discord.com/invite/solidjs)

## Available Scripts

In the project directory, you can run:

### `pnpm dev`

Runs the app in the development mode.<br>
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### `pnpm build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

### `pnpm preview`

Builds and previews the application locally in the Cloudflare Workers runtime.

## Deployment

Authenticate with Cloudflare once using `pnpm wrangler login`, then run:

```bash
pnpm deploy
```

Cloudflare bindings can be added to `wrangler.jsonc`. Put local secrets in
`.dev.vars`; both `.dev.vars*` and `.env*` are ignored by Git.
