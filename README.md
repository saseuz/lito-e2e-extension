# Lito E2E extension

React + TypeScript + Vite, Chrome Manifest V3. The popup uses the Laravel public API for live Merriam-Webster definitions; it never calls Merriam-Webster directly. API contract and licensing decision: `../backend/docs/public-lookup-api.md`.

## Current design

The popup uses a centered, warm dictionary-card layout inspired by the approved Lito E2E reference screens:

- The header shows **Lito E2E**, the “A word worth knowing.” tagline, and a light/dark theme button.
- The search control is full-width with a Lucide search icon, clear control, and centered arrow submit button.
- The empty state explains the four capabilities: definitions, pronunciation, examples, and trusted sources. It includes the built-in books illustration.
- A successful lookup shows the word, part-of-speech badge, pronunciation/audio when available, and tabs for **Meanings**, **Examples**, and **Source**.
- Meanings are displayed in numbered cards; source attribution remains visible with the official Merriam-Webster logo when applicable.
- Loading, unavailable-provider, and not-found states have their own centered messages.

Tailwind CSS is loaded through the Vite plugin, while the design tokens and extension-specific layout rules remain in `src/style.css`. Interface icons come from `lucide-react`; the books illustration is the product artwork rather than an icon.

## Development and loading Chrome

1. Start Laravel from `backend/` with `php artisan serve --host=127.0.0.1 --port=8000`. Configure the existing server-side `MERRIAM_WEBSTER_PRODUCT` and matching API key. No fixture seeding is required.
2. From `extension/`, run `npm ci` and `npm run build:dev`. Default endpoint: `http://localhost:8000/api/v1/dictionary/lookup`.
3. Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, then select `/home/zypp/code/lito-dictionary/extension/dist`.
4. Pin **Lito E2E**. Open its popup and search `hello`. Search other words such as `cat` or `apple` too. Results show Merriam-Webster’s logo and source name. Each search uses the live provider without permanent storage. A miss displays not-found. Stop Laravel to see the network-error state.
5. After edits run `npm run build:dev`, then click Reload on the extension card and reopen the popup. Do not load the Vite development server as an extension.

## Endpoint configuration

Create `.env.development.local` with `VITE_API_URL=http://localhost:8000/api/v1/dictionary/lookup` if changing development setup. For production create `.env.production.local` with `VITE_API_URL=https://YOUR-BACKEND/api/v1/dictionary/lookup`, then run `npm run build`. The build intentionally refuses a missing production endpoint or plain HTTP. These files are ignored. The URL is public configuration, never put provider keys into any `VITE_` variable.

The build generates `dist/manifest.json` with a host permission limited to the API hostname and a connect CSP limited to the API origin. Chrome host patterns do not narrow by port, but CSP does. A small background service worker registers a selection-only context menu. There are no content scripts, account features, or vocabulary storage. Popup requests omit credentials, time out after 15 seconds, and render text through React. API error responses, 404, 422, 429, loading and success each have visible states. The fixture has no audio; a licensed `audio_url` can be played when supplied.

`npm run build:dev` and `npm run build` both run TypeScript checks. Only generated `dist/` is loaded in Chrome; source and lockfile belong in version control. This sibling folder is outside the existing backend Git repository and needs its own repository or a parent monorepo decision before pushing.

The official logo in `public/merriam-webster.png` comes from https://dictionaryapi.com/info/branding-guidelines and is displayed unmodified at 50×50. API usage must remain within the non-commercial terms and daily quota. Permanent retention is not enabled for public responses.

## Right-click lookup

After rebuilding, reload Lito at `chrome://extensions` (accept the new context-menu permission if prompted). Select a word on a webpage, right-click, and choose **Look up “word” in Lito**. A separate small Lito window opens and automatically searches through the same Laravel API. The toolbar popup still works normally.

This provides English dictionary meanings, not translation into Burmese or another language. Only selected text is passed; page URLs and surrounding content are not collected. Selections over 255 characters show a local validation error without contacting the API. No selection is saved in extension storage. The worker passes the selection in a local extension URL fragment, which the UI clears after reading.

Verification: `node --test tests/context-menu.test.mjs` exercises menu registration, selection encoding, unrelated/empty selections, and the oversized-selection error. `npm run build:dev` checks TypeScript and bundles the extension. Native Chrome menu interaction still requires manual verification after reload.
