import test from "node:test";
import assert from "node:assert/strict";

import { createDirectTransport } from "../src/transport.ts";
import { installNav } from "../src/nav.ts";
import { installBrowser } from "../src/browser.ts";
import { installPdf } from "../src/pdf.ts";
import type { LocalBroker } from "../src/types.ts";

test("nav / browser / pdf installers call the right capability/method/options", async () => {
  const calls: Array<[string, string, unknown]> = [];
  const broker: LocalBroker = {
    async invoke(capability, method, options) {
      calls.push([capability, method, options]);
      return null;
    },
  };
  const t = createDirectTransport(broker);

  await installNav(t).go("/welcome");
  await installNav(t).menu();
  await installBrowser(t).open("https://cobd.ca");
  await installPdf(t).open("/docs/a.pdf");

  assert.deepEqual(calls, [
    ["nav", "go", { url: "/welcome" }],
    ["nav", "menu", undefined],
    ["browser", "open", { url: "https://cobd.ca" }],
    ["pdf", "open", { file: "/docs/a.pdf" }],
  ]);
});
