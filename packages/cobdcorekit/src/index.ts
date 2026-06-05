import { createTransport } from "./transport.js";
import { installGeolocationShim } from "./geolocation.js";
import { installTorch } from "./torch.js";
import type { Cobdkit, TransportOptions } from "./types.js";

export const VERSION = "0.0.0";

/**
 * Install both surfaces:
 *   - overrides `navigator.geolocation` (callers see a standard API)
 *   - exposes the `cobdkit` global (currently `cobdkit.torch`)
 *
 * Works in both contexts off the same call:
 *   - **in a mini-app iframe** — pass `{ hostOrigin }`; requests postMessage to
 *     the parent shell. Call this as the very first script, before app code.
 *   - **in the shell itself** — pass `{ broker }` (a cobdhostkit broker's
 *     `.local`); requests go in-process with no iframe hop.
 */
export function installCobdkit(opts: TransportOptions = {}): Cobdkit {
  const transport = createTransport(opts);

  installGeolocationShim(transport);
  const torch = installTorch(transport);

  const cobdkit: Cobdkit = {
    get version() {
      return VERSION;
    },
    torch,
  };

  (globalThis as { cobdkit?: Cobdkit }).cobdkit = cobdkit;
  return cobdkit;
}

// Auto-install when the host injects this with a config marker on the window.
if (typeof window !== "undefined" && (window as { __COBDKIT_AUTOINSTALL__?: unknown }).__COBDKIT_AUTOINSTALL__) {
  installCobdkit((window as { __COBDKIT_CONFIG__?: TransportOptions }).__COBDKIT_CONFIG__ ?? {});
}

export { createTransport, createIframeTransport, createDirectTransport } from "./transport.js";
export { installGeolocationShim } from "./geolocation.js";
export { installTorch } from "./torch.js";
export type {
  Cobdkit,
  TorchAPI,
  Transport,
  TransportOptions,
  LocalBroker,
  CallMessage,
  ResultMessage,
  ErrorMessage,
  EventMessage,
  InboundMessage,
} from "./types.js";
