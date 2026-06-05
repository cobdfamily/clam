# cobdkit

The mini-app bridge runtime for the cobdfamily super-app shell.

A mini-app runs inside a sandboxed iframe hosted by the native Capacitor shell.
`cobdkit` is injected as the **first script** in that iframe and gives the
mini-app native capabilities without it ever touching a Capacitor plugin
directly. Everything funnels through a single `postMessage` protocol to the host
broker, which owns permissions and the real native calls.

Two surfaces, one transport:

| Surface                 | Kind                          | Mini-app sees |
| ----------------------- | ----------------------------- | ------------- |
| `navigator.geolocation` | **shim** of the W3C API       | a standard browser API — unmodified apps just work |
| `cobdkit.torch`         | **new** API (no web standard) | `on()` / `off()` / `toggle()` / `isOn` |

```
navigator.geolocation (shimmed)      cobdkit.torch.*
            \                          /
             ----- call(capability) ---
                       |
                postMessage protocol
                       |
              host broker (permissions + native)
```

## Packages

- [`packages/cobdkit`](packages/cobdkit) — `@cobdfamily/cobdkit`, the injected runtime.

## Develop

```sh
npm install
npm run build --workspaces
npm test --workspaces
```
