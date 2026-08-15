# Changelog

All notable changes to this project are documented in this file.
This project follows [Semantic Versioning](https://semver.org/).

## [0.1.0] - Unreleased

Initial release. Package renamed from the placeholder `notify-toast` to **ChimeKit**
(`chimekit` on npm) — the `notify` API, DOM `id`/class conventions (`notify-toast-<id>`,
`.notify-*`), and CSS custom properties (`--notify-*`) are unaffected by the rename.

- Framework-agnostic core: manager, stacking, timers, backdrop, dedupe, `singleAtATime`.
- Default `success` / `error` / `warning` / `info` types plus `notify.custom()`.
- Three timer styles (`none`, `progress-bar`, `countdown-number`) with pause-on-hover.
- Six positions, each with an independent stack, `maxVisible` collapse + "Show more/less" + "Clear All".
- Dedupe via `unique` + `duplicateStrategy` (`ignore` / `restart-timer` / `bump-to-top`).
- Shared backdrop tied to notification lifecycle; toasts always render above the dim overlay so
  clicking a toast never closes it, and `closeOnClick` (opt-in, defaults to `false`) controls
  whether clicking the dimmed area outside the toast dismisses it.
- Global event emitter (`open` / `close` / `action`) plus per-call callbacks.
- Full `CloseReason` coverage: `timer`, `manual-close-icon`, `clear-all`, `programmatic`,
  `backdrop-click`, `replaced`.
- Per-notification `backgroundColor` / `textColor` overrides for one-off custom styling.
- Default types (`success`/`error`/`warning`/`info`) are distinguished by icon and icon color only —
  no colored border/stripe on the toast card.
- `countdown-number` timer renders inline, right after the message (with a `1.5em` gap), instead of
  floating in a corner or wrapping onto its own line.
- Every rendered element gets a stable, unique DOM `id` for CSS/JS targeting: the toast root, icon,
  body, title, message, countdown, actions wrapper + each action button, progress track/fill, and
  close button (all suffixed with the notification's `id`), plus shared elements `notify-root`,
  `notify-backdrop`, and per-position `notify-stack-<position>` / `notify-stack-chrome-<position>` /
  `notify-show-more-<position>` / `notify-clear-all-<position>`.
- Confirmed and tested the notification-id contract: every `notify.*()` call returns the
  notification's `id`, and `onClose(id, reason)` plus the global `close` event always report that
  exact same `id` back, so callers can tell which notification opened or closed.
- `message` now also accepts `{ html: string }` for raw markup (in addition to string/`HTMLElement`/
  function), inserted via `innerHTML` — documented as a trusted-content-only escape hatch, same
  caveat as React's `dangerouslySetInnerHTML`.
- Confirmed and tested that `actions` and `duration`/`timerStyle` are fully independent — an action
  notification can carry a progress bar or countdown timer alongside its buttons.
- Accessibility: ARIA roles/live regions, keyboard-focusable close button, `Escape` to dismiss.
- Optional `chimekit/react` and `chimekit/angular` adapters.
- ESM + CJS + UMD builds with TypeScript declarations.
- `demo/index.html` playground covering every option above (global config, all timer styles,
  actions with a selectable timer style, custom HTML messages, dedupe, stacking overflow, custom
  colors for default types and custom notifications, element-id/notification-id tracking, and a
  live event log) — every section has a "Show code" panel with the exact call it makes, updating
  live as controls change.
- Demo: added a long-message + `countdown-number` example (Timer styles section) confirming the
  inline countdown lands cleanly after the last word when the message wraps across several lines,
  instead of clipping or overlapping the close button.
- Added `COUNTDOWN_SLOT_ATTR` (exported from the package root): include an element with this
  attribute anywhere in a `{ html }`/custom-element message to mark exactly where the
  `countdown-number` timer renders — it's swapped in for that marker, so custom HTML can appear
  both before *and after* the countdown. Falls back to appending at the end when no marker is
  present, so existing `{ html }` messages are unaffected.
- Demo: the Custom & edge cases section's "Custom HTML message" example now has its own timer-style
  selector (independent of the Actions one) and its HTML includes a `COUNTDOWN_SLOT_ATTR` marker
  followed by more custom markup, to make the new slot behavior directly visible.
- Demo: the Default types section now has a "custom icon" toggle letting you override the icon on
  `success`/`error`/`warning`/`info` toasts with either raw `<svg>` markup or a CSS class name,
  proving `icon` accepts both (this was already supported by the core; the demo just didn't expose
  it before).
