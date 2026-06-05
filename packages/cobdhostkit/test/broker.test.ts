import test from "node:test";
import assert from "node:assert/strict";

import { createHostBroker } from "../src/broker.ts";

// These exercise the in-process `.local` path, which needs no `window` and no
// native plugins — so they run under plain node. (The torch capability itself
// is covered where a real Capacitor runtime exists.)

test("local broker invokes registered capabilities in-process", async () => {
  const broker = createHostBroker({
    capabilities: {
      echo: async (method, options) => ({ method, options }),
    },
  });

  const result = await broker.local.invoke("echo", "ping", { x: 1 }, () => {});
  assert.deepEqual(result, { method: "ping", options: { x: 1 } });
});

test("local broker rejects an unknown capability", async () => {
  const broker = createHostBroker({});
  await assert.rejects(
    () => broker.local.invoke("nope", "x", null, () => {}),
    /Unknown capability: nope/,
  );
});

test("register() adds a capability after construction", async () => {
  const broker = createHostBroker({});
  broker.register("sum", (_method, options) => {
    const { a, b } = options as { a: number; b: number };
    return a + b;
  });
  assert.equal(await broker.local.invoke("sum", "add", { a: 2, b: 3 }, () => {}), 5);
});

test("local broker forwards events a handler emits", async () => {
  const broker = createHostBroker({
    capabilities: {
      ticker: async (_method, _options, ctx) => {
        ctx.emit("tick", 1);
        ctx.emit("tick", 2);
        return "done";
      },
    },
  });

  const got: unknown[] = [];
  const result = await broker.local.invoke("ticker", "go", null, (event, payload) => {
    if (event === "tick") got.push(payload);
  });

  assert.equal(result, "done");
  assert.deepEqual(got, [1, 2]);
});
