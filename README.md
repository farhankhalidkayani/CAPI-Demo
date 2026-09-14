# Meta Conversions API (CAPI) Demo

Minimal, working demonstration of sending server-side events to Meta's
Conversions API — no SDK, no dependencies, just `fetch` and `crypto`.

## What this shows

- **PII hashing** — email/phone are lowercased, trimmed, and SHA-256 hashed
  before ever leaving the server (`src/capi.js:hashPII`), per Meta's spec.
- **Event payload shape** — `event_name`, `event_time`, `user_data`,
  `custom_data`, `action_source` for a server-side ("website") event.
- **Deduplication** — `event_id` is generated server-side and would be passed
  to the browser Pixel's `fbq('track', ..., {eventID})` call so Meta collapses
  the browser + server copies of the same event into one.
- **Test Events** — `META_TEST_EVENT_CODE` routes traffic to the Events
  Manager "Test Events" tab instead of production reporting.

## Run it — no Meta account needed

```bash
npm run serve   # http://localhost:3000 — click-to-fire Pixel + CAPI dedup demo
npm run send    # builds and prints a Purchase event payload
npm test        # self-check for hashing/payload logic
```

With no `META_PIXEL_ID`/`META_ACCESS_TOKEN` set, everything runs in **dry-run
mode**: the code builds the exact JSON it would POST to
`graph.facebook.com/v19.0/{pixel_id}/events` — correctly hashed, correctly
shaped — and prints it instead of sending it. That's the whole point of a
portfolio piece: the payload construction, hashing, and dedup logic are the
skill being demonstrated, not possession of a Meta Business account.

## Run it against real Meta (optional)

If you do have Business Manager access: Events Manager → your Pixel →
Settings → "Conversions API" → generate an access token, then:

```bash
cp .env.example .env   # fill in your pixel ID + access token
export $(cat .env | xargs)
npm run serve
```

Now the same demo hits the real Graph API. Check Events Manager → Test
Events (with `META_TEST_EVENT_CODE` set) to see the browser + server events
arrive and collapse into one via `event_id`.

## Deploy to Vercel

The front-end demo (`public/index.html` + `api/purchase.js` + `api/config.js`)
is Vercel-ready as-is — `api/*.js` deploy as serverless functions, `public/`
as static assets, `vercel.json` rewrites `/` to `public/index.html`.

```bash
npx vercel        # first deploy, follow the prompts (link/create a project)
npx vercel --prod # promote to production URL
```

Works with zero env vars set (dry-run mode, same as local). To hit the real
Graph API, set env vars on the Vercel project instead of `.env`:

```bash
npx vercel env add META_PIXEL_ID
npx vercel env add META_ACCESS_TOKEN
npx vercel env add META_TEST_EVENT_CODE
npx vercel --prod   # redeploy to pick up the new env vars
```

`server.js` (the local `npm run serve` script) isn't used on Vercel — it's
plain `node:http`, kept only for running the demo locally without the Vercel
CLI.

## Best practices applied here

- **Deduplication** — same `event_id` on browser Pixel + server CAPI event,
  within Meta's 48h dedup window, matching `event_name` on both sides.
- **Event Match Quality** — stack multiple identifiers (`em`, `ph`,
  `external_id`, IP, user agent, `fbc`/`fbp`) rather than relying on one;
  Meta targets an EMQ score above 7/10.
- **Hashing rules** — `em`/`ph`/`external_id` are SHA-256 hashed
  (lowercase + trimmed); `fbc`/`fbp` are sent as-is, unhashed, per spec.
- **Token handling** — access token comes from `.env`, never committed;
  in production this belongs in a secrets vault, not server logs.

## Files

- `src/capi.js` — `hashPII`, `buildEvent`, `sendEvents`
- `examples/send-purchase-event.js` — runnable, server-only example
- `server.js` / `public/index.html` — front-end demo: Pixel + CAPI dedup
- `test/test-capi.js` — assert-based check (no network calls)

Skipped: retry/backoff, batching, a persistent event-id store for real
dedup — add when this moves past a demo into a service that runs unattended.
