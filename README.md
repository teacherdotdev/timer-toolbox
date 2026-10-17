# Timer Toolbox

Free classroom timers for the projector, from [teacher.dev](https://teacher.dev). The first
tool is the **pie timer** at `/pie`: a span of time split into labelled, coloured segments
that drains like a Time Timer, so students can see how long is left and which part they're
in. Words used in the code are defined in [GLOSSARY.md](./GLOSSARY.md).

- **Everything stays on the device.** Timers and settings live in `localStorage`. Nothing is
  uploaded. Settings → _Download backup_ saves them as a `.json` file to restore elsewhere.
- **Accurate in background tabs.** Time left is worked out from timestamps, never counted,
  and chimes are scheduled ahead on the Web Audio clock, so they land on time while the
  teacher is in another tab (`src/lib/run.ts`, `src/lib/sounds.svelte.ts`).
- **Pop-out** (Chrome and Edge): a small always-on-top window using Document
  Picture-in-Picture (`src/lib/popout.svelte.ts`).
- **Supported:** Safari 15+ and current Chrome, Edge and Firefox.

## Development

```sh
bun install
# from the workspace root — never run `bun run dev` directly:
node ./scripts/agent-dev.mjs timers --no-pocketbase
bun run check && bun run lint && bun run build
```

Analytics: Cloudflare Web Analytics loads only when `CF_BEACON_TOKEN` is set at build time
(declared in `src/env.ts`). Set it on the **Production** environment in Vercel only, so
local and preview builds count no visits.

Code layout: `src/lib/run.ts` (the running timer, as pure functions),
`src/lib/state.svelte.ts` (saved timers, settings, storage), `src/lib/components/`
(pie, picker, editor, pop-out), `src/routes/pie/` and `src/routes/settings/`.

## Licensing

Apache-2.0 (see `LICENSE.txt`).
