# @cobdfamily/cobd-app-generator

Generates the family of near-identical Capacitor apps. Each app's web layer is
the **oister umbrella shell** (rendered from its `brand.json` + `menu.json` +
`seo.json` via [`@cobdfamily/oister`](../oister)); the apps differ only by
**identifier**, **icon**, **menu**, and **SEO/branding**.

> The shared web `base` is **optional** — the oister shell is self-contained
> (it loads the CLF runtime from the CDN and the app itself in an `<iframe>`), so
> with `base` unset the generator emits the shell only. Set `base` in
> `generator.config.json` if an app needs extra built web assets in its `webDir`.

This is **approach D**: native `android/`/`ios/` projects are *disposable*. They
aren't committed; they're regenerated from scratch at a **pinned** Capacitor
version on every build. So the apps are identical *by construction*, and
upgrading Capacitor is a one-line bump in `generator.config.json` — there are no
checked-in native projects to migrate.

## Layout

```
generator.config.json     pinned Capacitor version, platforms, base ref   ← bump to upgrade ALL apps
shared/overlay.json       DEPRECATED — permissions are now per-app (brand extra.capabilities)
shared/cdn.json           CDN/SRI manifest the oister shell loads (URLs + integrity)
apps/<id>/
  brand.json              { appId, appName, extra, seo } ← identity + theme + domains + capabilities + page metadata
  icon.png                ≥1024px source                ← the app icon (you add this)
  menu.json               side-drawer nav items         ← {label, target}
  apps.json               home-screen launcher tiles    ← {label, href, icon} for <cobd-apps-grid>
  assets/                 per-app static files          ← logo / og image, copied to webDir/assets/ (self-hosted)
bin/gen.mjs               the generator CLI
src/lib.mjs               pure, tested core logic
templates/                signing + CI (match, exportOptions, gradle, workflow)
.generated/               disposable output (gitignored)
```

## Use

```sh
node bin/gen.mjs --list                 # alpha, bravo, charlie
node bin/gen.mjs alpha --dry-run         # print the plan, touch nothing
node bin/gen.mjs alpha                    # regenerate one app (needs the native toolchain)
node bin/gen.mjs --all                    # regenerate every app
```

Each run: build base web → assemble webDir (this app's `menu.json` + `apps.json` +
`brand.json`, and render `index.html` from `brand.json` + `menu.json` + `seo.json`
+ `shared/cdn.json` via [`@cobdfamily/oister`](../oister)) → scaffold an ephemeral
project at the pinned version → `npm install` → `cap add` → apply native
permissions (from `brand.extra.capabilities`) → `@capacitor/assets` (icon/splash
from `icon.png`) → `cap sync`. The result in `.generated/<app>/` is ready to
build + sign.

> The generated `index.html` is the oister umbrella shell. Its home screen is a
> `<cobd-apps-grid>` launcher fed by the app's `apps.json` (copied into the
> webDir); `menu.json` is the side-drawer nav, `brand.json` the title + theme
> colour, `seo.json` the page metadata. Tapping a launcher tile navigates the
> WebView to that app (Capacitor's `allowNavigation` keeps in-domain apps inside
> and sends off-domain ones to the system browser). The
> `@cobdfamily/cobd-apps-grid` bundle is **self-hosted** — the generator
> copies it into `www/cobd-apps-grid/` and references it relatively, so
> the URL is set by the build and it works offline (set
> `generator.config.json > appsGridJs.url` only to use a CDN instead).

> The `cap add` / asset / sync steps need the native toolchains (Android SDK,
> Xcode, CocoaPods). `--dry-run` and the `npm test` logic run anywhere.

## Offline + serving the shell

Each app's webDir gets an offline **service worker** (`sw.js` +
`sw-register.js` + `offline.html`, from `@cobdfamily/oister`): it
precaches the shell (`index.html` + the JSON) and runtime-caches the
CLF CDN assets and visited pages, so the launcher works offline. In a
Capacitor WebView the SW needs **app-bound domains** turned on — which
the generator derives from a single source, the app's
`brand.json > extra.domains` (e.g. `["bowencommunity.ca"]`). Everything
else is a subdomain of those: from `extra.domains` the generator writes
`WKAppBoundDomains` (Info.plist), sets `limitsNavigationsToAppBoundDomains`
and `server.allowNavigation` (`["bowencommunity.ca", "*.bowencommunity.ca"]`,
covering `apps.`/`forum.`/… subdomains) in `capacitor.config.ts`. So
in-domain navigations stay in the WebView (off-domain → system browser),
SWs are enabled, and you set the domain in one place. (Subresources from
other origins like the clf CDN still load — only navigations are gated.)

The generator also emits a **per-app static-web-server image context**
(`Dockerfile` + `sws.toml` beside `www/`), mirroring clf-factory's
`clf-cdn` image (same `joseluisq/static-web-server` base). Build it
from the app's output dir to serve the shell remotely (one image per
app, routed by hostname through the barbet gateway):

```sh
docker build -t cobdfamily/oister-<appId-with-dashes> .generated/<app>/
```

When `extra.domains` is set, the app loads **remotely** by default:
`renderCapacitorConfig` points Capacitor `server.url` at
`https://apps.<primary domain>` (the per-app sws image), so updating an
app is a redeploy — no App Store re-release. The same `webDir` is still
emitted (it's the sws image's content and an offline fallback), and the
service worker keeps it working offline. Drop `server.url` if you'd
rather ship the bundled `webDir` instead.

## Keeping the CDN manifest current

`shared/cdn.json` holds the URLs + SRI integrity for the CLF assets the shell
loads. The CDN paths are **versioned** (`clf-core/<ver>/`, `clf-assets/cf<ver>/`),
so they change on every clf release — don't hand-edit. Refresh them with:

```sh
npm run sync-cdn        # fetches cdn.blindhub.ca/manifest.json, recomputes SRI
```

It reads the live CDN manifest, builds the eight asset URLs from its version
paths, fetches each asset to compute its `sha384` integrity, and rewrites
`shared/cdn.json`. Run it after a clf-core / clf-factory release.

## Adding / changing an app

- New app → add `apps/<id>/` with `brand.json` (incl. its `seo` block), `menu.json`, `apps.json`, `icon.png`, and an `assets/` dir for branding.
- Different launcher tiles → edit that app's `apps.json` (the home-screen grid).
- Different side-drawer nav → edit that app's `menu.json`.
- Different page metadata → edit the `seo` block in that app's `brand.json`.
- Logo / og image → drop files in `apps/<id>/assets/` and reference them as `assets/…` (the generator self-hosts them and absolutizes og:image/logo to `apps.<domain>`).
- Allowed domains / app-bound + nav + `server.url` → set `extra.domains` in that app's `brand.json`.
- Native permissions → set `extra.capabilities` in that app's `brand.json`.
- Different icon → replace that app's `icon.png`.
- Shared CDN refresh → re-run `sync-cdn` after a clf release; every app inherits it on next regen.

## Signing (survives regeneration)

Signing material lives **outside** the disposable projects and is injected at
build time, so regeneration never loses it:

- **Android** — keystore via Gradle injected properties. See
  [`templates/android-signing.md`](templates/android-signing.md).
- **iOS** — `fastlane match` installs certs/profiles into the runner keychain;
  signing is applied via [`templates/exportOptions.plist`](templates/exportOptions.plist)
  (manual signing). See [`templates/fastlane/`](templates/fastlane).

## CI

[`templates/ci/build-apps.yml`](templates/ci/build-apps.yml) is a matrix workflow
(Android on Linux, iOS on the self-hosted M1 runner). It's a template so it
doesn't fire before signing secrets exist — copy it into `.github/workflows/`
when ready.

## License

AGPL-3.0
