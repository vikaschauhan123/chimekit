# ChimeKit

Framework-agnostic, macOS-style notification/toast library. Zero runtime dependencies, works in
plain JS/TS, React, Angular, Vue, Svelte, or any other framework.

**[▶ Live demo](https://vikaschauhan123.github.io/chimekit/demo/index.html)** — a playground
covering every option below.

- Stacked toasts in any of 6 positions, with "Show more / Show less" and "Clear All"
- 4 built-in types (`success` / `error` / `warning` / `info`) plus fully custom notifications
- 3 timer styles (`progress-bar`, `countdown-number`, `none`) with pause-on-hover — work on action
  notifications too, fully independent of `actions`
- Custom HTML messages via `message: { html: '...' }`, alongside plain text/`HTMLElement`/function —
  mark exactly where the countdown-number timer renders with `COUNTDOWN_SLOT_ATTR`, so custom HTML
  can appear before *and after* the countdown
- Per-notification `backgroundColor` / `textColor` overrides for one-off custom styling
- Every `notify.*()` call returns the notification's `id`; every close reports that same `id` back
- Every rendered part (toast, icon, title, message, actions, close button, timer UI, …) gets a
  stable, unique DOM `id` for direct CSS/JS targeting
- Optional backdrop, dedupe strategies, `singleAtATime` mode
- Full TypeScript types, ESM + CJS + UMD builds, tree-shakeable
- Optional `chimekit/react`, `chimekit/angular`, and `chimekit/vue` adapters, each a thin wrapper
  (sub-1KB gzip) over the same shared engine — no duplicated core code, no separate singletons
- Ships with a live playground ([`demo/index.html`](https://vikaschauhan123.github.io/chimekit/demo/index.html)) covering every option above

## Install

```bash
npm i chimekit
```

```js
import { notify, configure } from 'chimekit';
import 'chimekit/style.css';
```

## Quick start

```js
configure({
  position: 'top-right',
  maxVisible: 3,
  singleAtATime: false,
  backdrop: { enabled: false },
});

notify.success({
  title: 'Saved',
  message: 'Your changes have been saved.',
  duration: 4000,
  timerStyle: 'progress-bar',
});

notify.error({
  title: 'Upload failed',
  message: 'Please check your connection and try again.',
  duration: 'infinite',
  actions: [{ id: 'retry', label: 'Retry', style: 'primary' }],
  onAction: (id, actionId) => { if (actionId === 'retry') retryUpload(); },
});

notify.custom({
  icon: false,
  message: 'Copied to clipboard',
  duration: 1500,
  timerStyle: 'none',
  showCloseButton: false,
});

const id = notify.info({ message: 'Syncing…', duration: 'infinite', unique: 'sync-status' });
notify.close(id);

notify.custom({
  title: 'Custom colors',
  message: 'One-off styling for just this toast.',
  backgroundColor: '#111827',
  textColor: '#fde68a',
  duration: 5000,
});
```

## API

### `notify`

| Method | Description |
|---|---|
| `notify.success(options)` | Success toast (check-circle icon) |
| `notify.error(options)` | Error toast (x-circle icon) |
| `notify.warning(options)` | Warning toast (exclamation-triangle icon) |
| `notify.info(options)` | Info toast (info-circle icon) |
| `notify.custom(options)` | Fully custom toast, no default type styling required |
| `notify.close(id, reason?)` | Close one notification by id |
| `notify.clearAll(position?)` | Close every notification (optionally scoped to one position) |
| `notify.on(event, handler)` / `notify.off(event, handler)` | Global event listeners (`'open' \| 'close' \| 'action'`) |

`configure(globalConfig)`, `clearAll(position?)`, and `closeAll(position?)` are also exported at the
top level.

### `NotificationOptions`

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Auto-generated if omitted |
| `type` | `'success' \| 'error' \| 'warning' \| 'info' \| 'custom'` | |
| `title` | `string` | Omit to hide |
| `message` | `string \| HTMLElement \| () => HTMLElement \| { html: string }` | Omit to hide; `{ html }` inserts raw markup — see note below |
| `icon` | `string \| HTMLElement \| false` | `false` = no icon; string = URL, image path, raw `<svg>`, or a CSS class name (e.g. an icon font) |
| `showCloseButton` | `boolean` | Default `true` |
| `actions` | `NotificationAction[]` | `{ id, label, onClick?, style? }` — fully independent of `duration`/`timerStyle`, so an action notification can still auto-dismiss with a progress bar or countdown |
| `className` | `string` | Extra class(es) on the toast root |
| `backgroundColor` | `string` | Overrides the toast background for this one notification only |
| `textColor` | `string` | Overrides title/message/icon color for this one notification only |
| `position` | `Position` | Per-call override of global position |
| `duration` | `number \| 'infinite'` | `'infinite'` (or `0`/omitted) = stays until closed |
| `timerStyle` | `'none' \| 'progress-bar' \| 'countdown-number'` | Visual treatment for `duration` |
| `backdrop` | `boolean \| BackdropConfig` | Per-call override of global backdrop |
| `unique` | `boolean \| string` | Dedupe key; see `duplicateStrategy` |
| `data` | `Record<string, unknown>` | Arbitrary metadata, not rendered |
| `pauseOnHover` | `boolean` | Per-call override; default from global config (`true`) |
| `render` | `(ctx) => HTMLElement` | Full custom render override, bypasses the default template entirely |
| `onOpen` / `onClose` / `onAction` | callbacks | Scoped to this one toast |

`CloseReason` is always one of: `'timer' | 'manual-close-icon' | 'clear-all' | 'programmatic' | 'backdrop-click' | 'replaced'`.

`message` accepts four shapes: a plain string (rendered as text, HTML-escaped), an `HTMLElement`
or a function returning one (for full control), or `{ html: '<b>...</b>' }` for raw markup inserted
via `innerHTML`. **Only pass `{ html }` content you trust or have sanitized yourself** — like
React's `dangerouslySetInnerHTML`, it does not escape its input, so untrusted user content passed
this way is an XSS risk.

#### Placing the countdown timer inside a custom message

With `timerStyle: 'countdown-number'`, the countdown normally renders right after your `{ html }`
or custom-element message content. To control exactly where it lands — including putting more of
your own markup *after* it — include an element with the `COUNTDOWN_SLOT_ATTR` attribute anywhere
in your markup; it gets swapped out for the live countdown element:

```js
import { notify, COUNTDOWN_SLOT_ATTR } from 'chimekit';

notify.custom({
  message: {
    html: `Renewing your session <span ${COUNTDOWN_SLOT_ATTR}></span> <em>— hang tight.</em>`,
  },
  duration: 5000,
  timerStyle: 'countdown-number',
});
// renders as: Renewing your session 5s — hang tight.
```

If no matching element is present, the countdown falls back to appending at the end (the default,
unchanged behavior). This has no effect with `timerStyle: 'progress-bar'`/`'none'` — the marker
element itself would just render as empty, invisible markup, so only include it when you're using
`'countdown-number'`.

### `GlobalConfig` (`configure()`)

| Field | Type | Default |
|---|---|---|
| `position` | `Position` | `'top-right'` |
| `backdrop` | `{ enabled, closeOnClick?, dismissBehavior? }` | `{ enabled: false, closeOnClick: false }` |
| `singleAtATime` | `boolean` | `false` |
| `onOverflowBehavior` | `'replace' \| 'queue-and-close-previous'` | `'replace'` |
| `maxVisible` | `number` | `3` |
| `duplicateStrategy` | `'ignore' \| 'restart-timer' \| 'bump-to-top'` | `'ignore'` |
| `animation` | `{ enter?, exit? }` | `{}` |
| `theme` | `'light' \| 'dark' \| 'auto' \| CustomThemeTokens` | `'auto'` |
| `zIndex` | `number` | `2147483000` |
| `rtl` | `boolean` | `false` |
| `newestOn` | `'top' \| 'bottom'` | `'top'` |
| `pauseOnHover` | `boolean` | `true` |

Positions: `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right` —
each maintains its own independent stack.

## Tracking notifications by id

Every `notify.success()` / `.error()` / `.warning()` / `.info()` / `.custom()` call returns the
notification's `id` (a string) — auto-generated unless you pass your own via `options.id`. That
same `id` comes back on every close, however it happened:

```js
const id = notify.info({
  message: 'Syncing…',
  duration: 'infinite',
  onClose: (closedId, reason) => {
    console.log(closedId === id, reason); // always true — same id every time
  },
});

notify.on('close', (payload) => {
  // payload.id, payload.reason, payload.type — for every notification, not just this one
});

notify.close(id); // fires onClose(id, 'programmatic') and the 'close' event above
```

This is what lets you know *which* toast just closed when you have several open at once, correlate
an action click back to its toast, or clean up other state tied to a specific notification.

### DOM ids

Every part of a rendered toast also gets a stable, unique `id` attribute (in addition to its class),
built from the notification's `id`, so you can target one specific notification's markup directly
with CSS or `document.getElementById(...)` — no need to rely on class selectors alone:

| Element | id pattern |
|---|---|
| Toast root | `notify-toast-<id>` |
| Icon | `notify-icon-<id>` |
| Body wrapper | `notify-body-<id>` |
| Title | `notify-title-<id>` |
| Message | `notify-message-<id>` |
| Countdown-number timer | `notify-countdown-<id>` |
| Actions wrapper | `notify-actions-<id>` |
| Each action button | `notify-action-<id>-<actionId>` |
| Progress-bar track / fill | `notify-progress-<id>` / `notify-progress-fill-<id>` |
| Close button | `notify-close-<id>` |

Shared, non-per-notification elements have fixed ids too: `notify-root`, `notify-backdrop`, and per
position `notify-stack-<position>`, `notify-stack-chrome-<position>`, `notify-show-more-<position>`,
`notify-clear-all-<position>`.

```js
const id = notify.error({ title: 'Upload failed', message: 'Please retry.' });
document.getElementById(`notify-toast-${id}`).style.outline = '2px solid red';
```

## Framework usage

### Vanilla JS

```js
import { notify } from 'chimekit';
import 'chimekit/style.css';

notify.success({ message: 'Done!' });
```

### React

```tsx
import { useNotify, NotificationProvider } from 'chimekit/react';
import 'chimekit/style.css';

function App() {
  return (
    <NotificationProvider config={{ position: 'top-right' }}>
      <SaveButton />
    </NotificationProvider>
  );
}

function SaveButton() {
  const notify = useNotify();
  return <button onClick={() => notify.success({ message: 'Saved!' })}>Save</button>;
}
```

`NotificationProvider` is optional — the core mounts its own DOM portal on `document.body`, so
`notify.*` works from any component (or outside React entirely) without it.

### Angular

```ts
import { NotificationService } from 'chimekit/angular';

@Component({ /* ... */ })
export class SaveButtonComponent {
  constructor(private notify: NotificationService) {}
  save() {
    this.notify.success({ message: 'Saved!' });
  }
}
```

### Vue

```ts
import { createApp } from 'vue';
import { NotificationPlugin } from 'chimekit/vue';
import 'chimekit/style.css';

createApp(App).use(NotificationPlugin, { position: 'top-right' }).mount('#app');
```

```vue
<script setup>
import { useNotify } from 'chimekit/vue';
const notify = useNotify();
</script>

<template>
  <button @click="notify.success({ message: 'Saved!' })">Save</button>
</template>
```

`NotificationPlugin` is optional (it only applies the global `configure()` call) — the core mounts
its own DOM portal on `document.body`, so `notify.*` works from any component without it.

### Next.js / Nuxt / other SSR frameworks

The core never touches `document`/`window` at import time — only when a `notify.*()` call actually
runs — so importing `chimekit` (or its adapters) is safe during server rendering. Just make sure the
code that *calls* `notify.*()` runs client-side, the same as any other DOM API: inside an event
handler, `useEffect`, `onMounted`, or a component marked `'use client'` in the Next.js App Router.

```tsx
'use client';
import { useNotify } from 'chimekit/react';

export function SaveButton() {
  const notify = useNotify();
  return <button onClick={() => notify.success({ message: 'Saved!' })}>Save</button>;
}
```

### Svelte, Solid, and everything else

There's no dedicated adapter because none is needed — `notify.*()` is plain framework-agnostic
JS/DOM, so the [Vanilla JS](#vanilla-js) usage above works as-is in any component or script.

## Styling

Override any of the CSS custom properties on `#notify-root` (or scope them tighter), for example:

```css
#notify-root {
  --notify-radius: 10px;
  --notify-success-color: #16a34a;
  --notify-width: 320px;
}
```

Set `theme: 'dark'`, `'light'`, or `'auto'` (system-driven) via `configure()`, or pass a
`CustomThemeTokens` object (`{ '--notify-bg': '#111', ... }`) to set your own tokens directly.

Each default type (`success`/`error`/`warning`/`info`) is distinguished by its icon and icon color
only — the toast card itself has no colored border or stripe, so it stays visually consistent with
`backgroundColor`/`textColor` overrides and with `className`-based custom styling.

### Icons

Every notification — including the built-in types — accepts an `icon` override, which can be raw
`<svg>` markup, a CSS class name (e.g. from an icon font already loaded on the page), an image
URL/path, or an `HTMLElement`. Pass `false` to hide the icon entirely.

```js
// Raw SVG — rendered as-is, colored via `currentColor` (follows the type's icon color/textColor).
notify.success({ message: 'Saved!', icon: '<svg viewBox="0 0 24 24">...</svg>' });

// A CSS class name — rendered as <i class="...">, for an icon font already on the page.
notify.error({ message: 'Failed.', icon: 'fa-solid fa-triangle-exclamation' });

// An image URL/path — rendered as <img>.
notify.info({ message: 'New version.', icon: '/icons/update.png' });

// No icon at all.
notify.warning({ message: 'Heads up.', icon: false });
```

For a single notification, `backgroundColor` and `textColor` override the theme just for that toast
(see the Quick start example above) — `backgroundColor` maps to `--notify-bg`, and `textColor` sets
the toast's text color and `--notify-muted` so the title, message, and icon all follow it.

With `timerStyle: 'countdown-number'`, the ticking number renders inline right after the message
text (with a `1.5em` gap) rather than floating in a corner — override `.notify-countdown`'s
`margin-left` to tighten or widen that gap.

For full control over markup, pass `render: (ctx) => HTMLElement` in `NotificationOptions` — the
default icon/title/message/actions/close/timer template is bypassed entirely and `ctx.close(reason?)`
is provided to wire up your own dismiss affordance.

### Backdrop

`backdrop.enabled` dims the page behind the toast(s); toasts always render above the dim overlay in
the same stacking context, so clicking inside a notification never triggers a backdrop dismissal.
Clicking the dimmed area *outside* the toast closes it only if `closeOnClick` is explicitly enabled
(`backdrop: { enabled: true, closeOnClick: true }`) — it defaults to `false`, so an enabled backdrop
is dismiss-via-timer/close-button/action only unless you opt in.

## Accessibility

- `success`/`info` toasts render with `role="status"` + `aria-live="polite"`; `error`/`warning` use
  `role="alert"` + `aria-live="assertive"`.
- The close button is a focusable, labeled `<button>`.
- `Escape` closes the currently focused toast, or the most recently opened one if focus is
  elsewhere.
- `timerStyle: 'none'` does not remove any functional signal for screen reader users — the toast's
  live region announcement and manual close button are unaffected by which timer visual is chosen.

## Demo playground

`demo/index.html` is a live playground covering every option in this README:

- **Global config** — position, default timer style, theme (light/dark/auto), `singleAtATime`,
  backdrop on/off, and a separate "close on backdrop click" toggle.
- **Default types** — one button per built-in type (`success`/`error`/`warning`/`info`), with an
  option to override the icon too — pick "svg" for raw `<svg>` markup or "CSS class" for a class
  name (backed by a small demo-only `::before` icon, so it renders without an icon font).
- **Timer styles** — dedicated buttons for `progress-bar`, `countdown-number`, `none`, and
  `'infinite'`, each firing with a fixed 6s duration so you can compare all three side by side
  regardless of the global timer-style selector, plus a long-message example that fires an
  8s `countdown-number` toast with several lines of wrapped text, to confirm the countdown lands
  cleanly after the last word instead of clipping or overlapping the close button.
- **Custom & edge cases** — actions (`Retry`/`Dismiss`) with its own selectable timer style (proving
  actions and timers work together); a custom HTML message with its own timer-style selector, whose
  markup includes a `COUNTDOWN_SLOT_ATTR` marker followed by more custom HTML, so switching to
  `countdown-number` visibly swaps the marker for the live countdown mid-sentence; a bare
  chrome-less message; `unique` + `'infinite'` dedupe; stacking overflow (fires 6 at once to show
  "Show more"/"Clear All"); and `clearAll()`.
- **Custom colors** — color pickers for `backgroundColor`/`textColor`, fired via `notify.custom()`.
- **Element ids & notification id tracking** — fires a notification, displays its returned `id`,
  outlines its toast via `document.getElementById('notify-toast-' + id)` to prove the DOM id is
  real and targetable, and confirms `onClose`/the `close` event report that exact same `id` back.
- **Event log** — a live feed of every `open`/`close`/`action` event via `notify.on(...)`.
- Every section also has a "Show code" panel with the exact call it makes, updating live as you
  change the controls above it.

Run `npm run build && npm run demo` (see Development below) to try it locally.

## Development

```bash
npm install
npm run build       # ESM + CJS + UMD to dist/, plus dist/style.css
npm test             # unit tests (vitest + jsdom)
npm run typecheck
npm run demo         # serves demo/index.html against the dist/ build
```

## License

MIT
