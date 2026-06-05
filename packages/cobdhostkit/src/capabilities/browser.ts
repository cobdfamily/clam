import { Browser } from "@capacitor/browser";

import type { CapabilityHandler } from "../types.js";

/** Native op the browser capability needs; defaults to @capacitor/browser. Injectable for testing. */
export interface BrowserBackend {
  open(url: string): Promise<void>;
}

const defaultBrowserBackend: BrowserBackend = {
  open: (url) => Browser.open({ url }),
};

export interface BrowserOptions {
  backend?: BrowserBackend;
}

/**
 * `browser` capability — `COBDCoreKit.browser.open(url)` opens an in-app browser
 * via `@capacitor/browser`.
 */
export function createBrowserCapability(opts: BrowserOptions = {}): CapabilityHandler {
  const backend = opts.backend ?? defaultBrowserBackend;
  return async (method, options) => {
    if (method !== "open") throw new Error(`browser: unknown method "${method}"`);
    const url = String((options as { url?: unknown })?.url ?? "");
    if (!url) throw new Error("browser.open: url required");
    await backend.open(url);
  };
}
