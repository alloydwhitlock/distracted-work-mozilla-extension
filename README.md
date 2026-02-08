# Distracted Work

A Firefox extension that blocks distracting websites and redirects you to a friendly (but firm) reminder to get back to work.

**[distracted.work](https://distracted.work)**

## Features

- **Site blocking** — Add domains to your block list and they'll be intercepted before the page loads. Subdomains are matched automatically (blocking `reddit.com` also blocks `old.reddit.com`).
- **Permanent blocks** — Mark sites as permanent so they're always blocked, regardless of schedule.
- **Schedule** — Set active hours and days so blocking only applies during work time (e.g. Mon-Fri, 9am-5pm).
- **Motivational redirects** — Blocked pages show a random message from 45+ quips like *"Your Slack status says 'Busy.' Act like it."*
- **17 themes** — Classic, Nord, Catppuccin, Tokyo Night, Dracula, Solarized, Gruvbox, and more. Each with light and dark variants.
- **Quick popup** — Toggle blocking, add sites, and switch themes without leaving your current tab.
- **Two-step removal** — Permanent blocks require a confirmation dialog to remove, so your past self can look out for your future self.
- **No data collection** — Everything stays in `browser.storage.local`. No analytics, no telemetry, no network requests.

## Install

The extension is currently pending review on [Firefox Add-ons (AMO)](https://addons.mozilla.org/en-US/firefox/addon/distracted-work/). In the meantime, you can load it manually for development (see below).

## Development

### Prerequisites

- Node.js
- Firefox
- Flox (Flox.dev)

### Setup

```bash
git clone https://github.com/alloydwhitlock/distracted-work-mozilla-extension-.git
cd distracted-work-extension
flox activiate
npm install
```

### Commands

```bash
npm test            # Run tests with coverage
npm run test:watch  # Run tests in watch mode
npm run lint        # Lint with web-ext
npm run build       # Build zip to dist/
npm start           # Run Firefox with extension loaded
```

### Project Structure

```
extension/
  background/blocker.js     # webRequest listener, message handling
  popup/popup.js            # Browser action popup (quick toggle, add site)
  options/options.js        # Full settings page (schedule, themes, site list)
  redirect/redirect.js      # Blocked page with motivational messages
  redirect/messages.js      # 45+ redirect messages
  shared/blocking-logic.js  # Pure functions for all blocking decisions
  shared/themes.css         # 17 themes with light/dark variants
  icons/                    # SVG icons
  manifest.json             # Manifest V2
site/                       # Static landing site for distracted.work
tests/                      # Jest test suites
```

### Architecture

All blocking logic lives in `shared/blocking-logic.js` as pure functions with no browser API dependencies. This makes the core logic fully testable with Jest and jsdom. The background script, popup, options page, and redirect page all depend on it.

The extension uses Manifest V2 with the `browser.*` API namespace for Firefox compatibility.

### Testing

128 tests across 8 suites. ~98% statement coverage, 100% function and line coverage.

```bash
npx jest tests/popup.test.js  # Run a single suite
```

## Privacy

No data leaves your browser. Blocked sites, schedule, and preferences are stored locally in `browser.storage.local`. See the [Privacy Policy](https://distracted.work/privacy.html).

## Support

If you find Distracted Work useful, consider [buying me a coffee](https://ko-fi.com/alloydwhitlock).

## License

MIT
