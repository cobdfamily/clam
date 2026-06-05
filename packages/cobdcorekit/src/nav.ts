import type { NavAPI, Transport } from "./types.js";

/**
 * `COBDCoreKit.nav` — shell navigation (ported from bowencommunity-core).
 * `go(url)` loads a property into the shell's single app iframe. The launcher
 * menu is rendered by the shell directly, so there is no `menu` method.
 */
export function installNav(transport: Transport): NavAPI {
  return {
    async go(url) {
      await transport.call("nav", "go", { url });
    },
  };
}
