import type { BrowserAPI, Transport } from "./types.js";

/** `COBDCoreKit.browser` — in-app browser via the host. */
export function installBrowser(transport: Transport): BrowserAPI {
  return {
    async open(url) {
      await transport.call("browser", "open", { url });
    },
  };
}
