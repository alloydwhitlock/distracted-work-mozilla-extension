# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                  # Jest with coverage
npm run test:watch        # Jest watch mode
npx jest tests/popup.test.js  # Run a single test file
npm run lint              # web-ext lint on extension/
npm run build             # Build zip to dist/
npm start                 # Run Firefox with extension loaded
```

## Architecture

Firefox Manifest V2 extension (`extension/`) with a static landing site (`site/`).

### Core Pattern: Pure Logic Extraction

`extension/shared/blocking-logic.js` contains all blocking decision logic as pure functions with zero browser API dependencies. It uses a conditional `module.exports` pattern to work in both Node.js (Jest) and browser contexts. All other extension scripts depend on it.

Key exports: `shouldBlock()`, `isBlocked()`, `isWithinSchedule()`, `isValidDomain()`, `cleanDomain()`, `DEFAULT_SETTINGS`.

### Component Interaction

- **background/blocker.js** — Persistent background script. Sets up `webRequest.onBeforeRequest` listener, redirects blocked URLs to `redirect/redirect.html`. Handles messages from popup/options (`getSettings`, `saveSettings`, `toggle`, `addSite`, `removeSite`, `getBlockStatus`). Tears down and re-adds the listener on every settings change.
- **popup/popup.js** — Browser action popup (340px). Quick toggle, add site, cycle theme. Communicates with background via `browser.runtime.sendMessage`.
- **options/options.js** — Full settings page. Schedule editor, theme/style selector, blocked sites list with permanent badges, two-step removal confirmation modal. Saves directly to `browser.storage.local` (background picks up changes via `storage.onChanged`).
- **redirect/redirect.js + messages.js** — Shown when a site is blocked. Displays random motivational message from 45+ options. Uses `window.close()` with `history.back()` fallback.
- **shared/themes.css** — 17 themes, each with light/dark variants via CSS custom properties and `body[data-style][class]` selectors.

### Firefox/MV2 Constraints

- Use `browser.*` API namespace, not `chrome.*`
- `background.persistent: true` is required when using `webRequestBlocking`
- `webRequestBlocking` + `<all_urls>` triggers manual AMO review
- Privacy/external links in extension pages must use absolute URLs (e.g., `https://distracted.work/privacy.html`), not relative paths which resolve to `moz-extension://`
- Prefer DOM methods over `innerHTML` to avoid AMO review flags
- `window.close()` doesn't work for tabs not opened by scripts — always provide fallback

## Testing

128 tests across 8 suites. Coverage: ~98% statements, 100% functions/lines. Tests live in `tests/` and mirror extension structure. The test environment is jsdom.

## CI/CD

- `.github/workflows/test.yml` — Runs tests + lint on push/PR
- `.github/workflows/release.yml` — Semantic versioning from commit messages, updates manifest version, builds zip, creates GitHub release
