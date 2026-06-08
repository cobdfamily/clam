# @cobdfamily/oister

The oister **umbrella-shell `index.html`** as a Handlebars
template, plus a TypeScript generator that renders it directly
from the per-app source files an app already has.

```ts
import { renderApp } from "@cobdfamily/oister";

const html = renderApp({
  brand,  // the app's brand.json   ({ appId, appName, extra })
  menu,   // the app's menu.json    ({ items: [{ label, target }] })
  seo,    // the app's seo.json     (page/site metadata; see below)
  cdn,    // the clf-core CDN/SRI manifest (URLs + integrity)
});

writeFileSync(".generated/cobd/www/index.html", html);
```

`renderApp` returns the finished page as a string — no implicit
file I/O, so it drops straight into a freshly regenerated app's
`webDir`.

## Two layers

- **`renderApp({ brand, menu, seo, cdn })`** — the high-level
  entry. Maps the per-app files onto an `OisterConfig` (applying
  COBD defaults for anything `seo.json` omits) and renders.
- **`renderOisterShell(config: OisterConfig)`** — the low-level
  core. Renders a fully-resolved config; useful if you assemble
  the config yourself. `appToConfig(input)` exposes the mapping
  on its own.

Both validate first and throw a descriptive error
(`brand.json: …`, `menu.json: …`, `oister config: …`) rather
than emitting a page with empty holes.

## The four inputs

| Input    | Source                              | Provides                                  |
|----------|-------------------------------------|-------------------------------------------|
| `brand`  | the app's `brand.json` (unchanged)  | `appName` → title, `extra.themeColor`     |
| `menu`   | the app's `menu.json` (unchanged)   | the single nav list (`items: label/target`) |
| `seo`    | a **new `seo.json`** (per app)      | lang, description, url, image, og, org, social, i18n, dark colour |
| `cdn`    | the clf-core CDN/SRI manifest       | the 8 asset URLs + `integrityAttr`        |

`brand.json` and `menu.json` are the exact files
cobd-app-generator already keeps under `apps/<app>/`. `seo.json`
is the only new per-app file; `description`, `url`, and `image`
are required, everything else falls back to a brand-derived or
COBD default (see `seo.example.json`). The `cdn` manifest can't
be hardcoded — the SRI hashes change every clf release — so it
stays an input.

## The navigation

`menu.json` is one flat `items: [{ label, target }]` list. The
template renders it twice from the same source:

- a `<ul slot="menu">` that `<cobd-app-shell>` (clf-core) picks
  up and renders as the side-menu nav via `<cobd-nav>` **local
  mode** — a single list, no slug lookup, no "More COBD" split;
- the `<noscript>` fallback list, so the menu still works with
  JS off.

> Requires `@cobdfamily/clf-core` with `<cobd-app-shell>`'s
> `slot="menu"` local-nav support (shipped alongside this
> package). The shell loads from `cdn.blindhub.ca` at runtime.

## The template

`src/assets/index.html` is plain Handlebars. The escaping
contract:

| Syntax        | Used for                                            |
|---------------|-----------------------------------------------------|
| `{{ x }}`     | text + URL attribute values (HTML-escaped)          |
| `{{{ x }}}`   | the CDN `integrity`/`crossorigin` attribute strings |
| `{{json x}}`  | values inside the JSON-LD `<script>` (stays valid JSON) |

## How cobd-app-generator uses it

During its **assemble-web** step the generator already has
`brand.json` and `menu.json` for the app (and copies them into
`webDir`). It adds `seo.json` per app, hands all four inputs to
`renderApp`, and writes the result:

```ts
import { renderApp } from "@cobdfamily/oister";

writeFileSync(join(www, "index.html"),
  renderApp({ brand, menu, seo, cdn: cdnManifest }));
```

No hand-maintained intermediate config: the per-app files *are*
the input, and this package owns the mapping + template.

## Build / test

```bash
npm run build   # tsc -> dist/, then copy the template into dist/assets/
npm test        # node --test via tsx (runs against src/)
```
