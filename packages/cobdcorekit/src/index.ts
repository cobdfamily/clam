import { createTransport } from "./transport.js";
import { installGeolocationShim } from "./geolocation.js";
import { installTorch } from "./torch.js";
import { installNav } from "./nav.js";
import { installBrowser } from "./browser.js";
import { installPdf } from "./pdf.js";
import type { COBDCoreKit, TransportOptions } from "./types.js";

export const VERSION = "0.0.0";

/**
 * Install the surfaces:
 *   - overrides `navigator.geolocation` (callers see a standard API, brokered)
 *   - exposes the `COBDCoreKit` global (`torch`, `nav`, `browser`, `pdf`)
 *
 * Works in both contexts off the same call:
 *   - **in a mini-app iframe** — pass `{ hostOrigin }`; requests postMessage to
 *     the parent shell. Call this as the very first script, before app code.
 *   - **in the shell itself** — pass `{ broker }` (a cobdhostkit broker's
 *     `.local`); requests go in-process with no iframe hop.
 */
export function installCOBDCoreKit(opts: TransportOptions = {}): COBDCoreKit {
  const transport = createTransport(opts);

  installGeolocationShim(transport);

  const COBDCoreKit: COBDCoreKit = {
    get version() {
      return VERSION;
    },
    torch: installTorch(transport),
    nav: installNav(transport),
    browser: installBrowser(transport),
    pdf: installPdf(transport),
  };

  (globalThis as { COBDCoreKit?: COBDCoreKit }).COBDCoreKit = COBDCoreKit;
  return COBDCoreKit;
}

// Auto-install when the host injects this with a config marker on the window.
if (typeof window !== "undefined" && (window as { __COBDCoreKit_AUTOINSTALL__?: unknown }).__COBDCoreKit_AUTOINSTALL__) {
  installCOBDCoreKit((window as { __COBDCoreKit_CONFIG__?: TransportOptions }).__COBDCoreKit_CONFIG__ ?? {});
}

export { createTransport, createIframeTransport, createDirectTransport } from "./transport.js";
export { installGeolocationShim } from "./geolocation.js";
export { installTorch } from "./torch.js";
export { installNav } from "./nav.js";
export { installBrowser } from "./browser.js";
export { installPdf } from "./pdf.js";
export type {
  COBDCoreKit,
  TorchAPI,
  NavAPI,
  BrowserAPI,
  PdfAPI,
  Transport,
  TransportOptions,
  LocalBroker,
  CallMessage,
  ResultMessage,
  ErrorMessage,
  EventMessage,
  InboundMessage,
} from "./types.js";
