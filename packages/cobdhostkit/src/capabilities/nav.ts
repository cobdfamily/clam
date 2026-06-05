import type { CapabilityHandler } from "../types.js";

/** How the shell actually navigates. Injectable; the default drives iframes. */
export interface NavTarget {
  go(url: string): void | Promise<void>;
  menu(): void | Promise<void>;
}

export interface NavOptions {
  /** Override the default DOM behavior entirely. */
  target?: NavTarget;
  /** Main-view iframe selector (default "#mainview"). */
  mainViewSelector?: string;
  /** Menu iframe selector (default "#menu"). */
  menuSelector?: string;
}

function domNavTarget(mainSel: string, menuSel: string): NavTarget {
  const isMobile = () => typeof window !== "undefined" && window.innerWidth < 801;
  return {
    go(url) {
      const main = document.querySelector<HTMLIFrameElement>(mainSel);
      if (main && main.getAttribute("src") !== url) main.setAttribute("src", url);
      if (isMobile()) {
        const menu = document.querySelector<HTMLElement>(menuSel);
        if (menu) menu.style.display = "none";
      }
      main?.focus();
    },
    menu() {
      const menu = document.querySelector<HTMLElement>(menuSel);
      if (menu) menu.style.display = "";
    },
  };
}

/**
 * `nav` capability — ported from bowencommunity-core's `CBNavigateTo`. `go(url)`
 * points the main view at a URL; `menu()` reveals the launcher menu. This is
 * pure shell UI (no native plugin): the default operates on `#mainview` /
 * `#menu` iframes and can be replaced with a custom `NavTarget`.
 *
 * Unlike core it does NOT set `allow="geolocation"` on the iframe — geolocation
 * is now brokered through the `geo` capability.
 */
export function createNavCapability(opts: NavOptions = {}): CapabilityHandler {
  const target =
    opts.target ?? domNavTarget(opts.mainViewSelector ?? "#mainview", opts.menuSelector ?? "#menu");

  return async (method, options) => {
    switch (method) {
      case "go": {
        const url = String((options as { url?: unknown })?.url ?? "");
        if (!url) throw new Error("nav.go: url required");
        await target.go(url);
        return;
      }
      case "menu":
        await target.menu();
        return;
      default:
        throw new Error(`nav: unknown method "${method}"`);
    }
  };
}
