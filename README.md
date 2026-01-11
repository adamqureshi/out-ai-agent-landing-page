# OUT AI Agent landing page (static)

This folder is a **static** landing page template for **OnlyUsedTesla.ai / OUT AI Agent**.

It’s intentionally simple so you can:
- upload it to GitHub as a visual spec for your developer
- host it anywhere (Azure Static Web Apps, Azure Storage static website, GitHub Pages, etc.)
- wire the form + chat widget to your backend later

This version is **minimal** — only the nav + hero + chat preview are included. Sections (Product / Pricing / Demo form / FAQ) were removed so you can add them back one-by-one.

## Files
- `index.html` — page structure + marketing copy + demo placeholders
- `styles.css` — all styling (mobile-first)
- `script.js` — nav toggle, animated chat preview, demo chat drawer, and a fake lead form submit

## Where to embed your real demo
In `index.html`, search for:

```html
<div class="demo-embed" id="demoEmbed" aria-label="Embed area">
```

Replace the placeholder with:
- an `<iframe>` to your hosted demo
- a `<video>` tag
- or a Lottie animation / GIF (recommended for mobile)

## Wiring the lead form to Azure
In `script.js`, search for:

```js
// In production, POST to your Azure endpoint here.
```

Replace the fake handler with a `fetch()` POST to your Azure Function / API endpoint.

## Wiring the chat widget to your AI agent
The demo chat is front-end only. For production:
- keep the UI (drawer + bubbles)
- on submit, call your Azure API
- stream tokens if you want “typing” output

Tip: keep your inventory sync separate from the chat endpoint so your chat stays fast.
