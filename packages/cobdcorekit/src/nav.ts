import type { NavAPI, Transport } from "./types.js";

/** `COBDCoreKit.nav` — shell navigation (ported from bowencommunity-core). */
export function installNav(transport: Transport): NavAPI {
  return {
    async go(url) {
      await transport.call("nav", "go", { url });
    },
    async menu() {
      await transport.call("nav", "menu");
    },
  };
}
