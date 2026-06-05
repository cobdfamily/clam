# oister

The native-bridge toolkit for the cobdfamily super-app shell. A super-app loads
its child apps into sandboxed iframes; `oister` is how any of that code — inside
an iframe or in the shell itself — reaches native device functionality.

## The two packages

| Package | Role |
| --- | --- |
| [`@cobdfamily/cobdcorekit`](packages/cobdcorekit) | The **client API**. The *only* thing you ever call. Used the same way whether your code runs **inside** a mini-app iframe or **outside** it in the shell. Exposes the surfaces apps use — a shimmed `navigator.geolocation`, the `cobdkit.torch` API, etc. |
| [`@cobdfamily/cobdhostkit`](packages/cobdhostkit) | The **native broker**. The *only* thing that actually touches Capacitor plugins (`@capgo/capacitor-flash`, `@capacitor/haptics`, …). Runs in the shell, enforces origin policy, answers requests. **Never called directly.** |

The rule: **always go through `cobdcorekit`; never call `cobdhostkit` directly** —
regardless of where your code runs. `cobdhostkit` is an implementation detail
that `cobdcorekit` talks to on your behalf.

```
   your code (in iframe OR in shell)
              │
              ▼
      @cobdfamily/cobdcorekit          ← the only API you call
              │
        (transport)
              │
              ▼
      @cobdfamily/cobdhostkit          ← the only thing that calls native
              │
              ▼
   @capgo/capacitor-flash, @capacitor/haptics, …
```

### Surfaces cobdcorekit exposes

| Surface | Kind | Caller sees |
| --- | --- | --- |
| `navigator.geolocation` | **shim** of the W3C API | a standard browser API — unmodified apps just work |
| `cobdkit.torch` | **new** API (no web standard) | `on()` / `off()` / `toggle()` / `isOn` |

## Develop

```sh
npm install
npm run build      # builds cobdcorekit, then cobdhostkit (shares its types)
npm test
```

## Status

`cobdcorekit`'s transport currently implements the **in-iframe** path
(postMessage to the parent shell). The **in-shell** path — where shell code uses
the same `cobdcorekit` API to reach the local `cobdhostkit` broker without a
round-trip through an iframe — is not built yet.
