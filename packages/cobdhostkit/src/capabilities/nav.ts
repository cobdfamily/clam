import type { CapabilityHandler } from "../types.js";

/** How the shell navigates its single app iframe. Injectable; default drives the DOM. */
export interface NavTarget {
  go(url: string): void | Promise<void>;
}

export interface NavOptions {
  /** Override the default DOM behavior. */
  target?: NavTarget;
  /** Selector of the single app iframe (default "#app"). */
  appSelector?: string;
}

function domNavTarget(appSel: string): NavTarget {
  return {
    go(url) {
      const frame = document.querySelector<HTMLIFrameElement>(appSel);
      if (frame && frame.getAttribute("src") !== url) frame.setAttribute("src", url);
      frame?.focus();
    },
  };
}

/**
 * `nav` capability — ported from bowencommunity-core's `CBNavigateTo`, adapted
 * to the single-iframe shell: `go(url)` points the one app iframe at a URL.
 *
 * The launcher menu is now rendered by the shell directly (not an iframe), so
 * there is no `menu` method here. Pure shell UI (no native plugin): the default
 * operates on the `#app` iframe and can be replaced with a custom `NavTarget`.
 * Unlike core it does NOT set `allow="geolocation"` — geolocation is brokered
 * through the `geo` capability.
 */
export function createNavCapability(opts: NavOptions = {}): CapabilityHandler {
  const target = opts.target ?? domNavTarget(opts.appSelector ?? "#app");

  return async (method, options) => {
    switch (method) {
      case "go": {
        const url = String((options as { url?: unknown })?.url ?? "");
        if (!url) throw new Error("nav.go: url required");
        await target.go(url);
        return;
      }
      default:
        throw new Error(`nav: unknown method "${method}"`);
    }
  };
}
