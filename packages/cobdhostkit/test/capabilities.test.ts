import test from "node:test";
import assert from "node:assert/strict";

import { createNavCapability } from "../src/capabilities/nav.ts";
import { createGeoCapability, type GeoBackend } from "../src/capabilities/geo.ts";
import { createBrowserCapability } from "../src/capabilities/browser.ts";
import { createPdfCapability } from "../src/capabilities/pdf.ts";
import type { CapabilityContext } from "../src/types.ts";

const ctx = (events: Array<[string, unknown]> = []): CapabilityContext => ({
  origin: "test",
  emit: (e, p) => events.push([e, p]),
});

test("nav.go / nav.menu drive the injected target", async () => {
  const seen: string[] = [];
  const nav = createNavCapability({
    target: { go: (url) => { seen.push(`go:${url}`); }, menu: () => { seen.push("menu"); } },
  });
  await nav("go", { url: "/welcome" }, ctx());
  await nav("menu", {}, ctx());
  assert.deepEqual(seen, ["go:/welcome", "menu"]);
  await assert.rejects(() => Promise.resolve(nav("go", {}, ctx())), /url required/);
  await assert.rejects(() => Promise.resolve(nav("zap", {}, ctx())), /unknown method/);
});

test("geo.getCurrentPosition flattens the native position", async () => {
  const backend: GeoBackend = {
    getCurrentPosition: async () => ({
      coords: { latitude: 49.3, longitude: -123.3, accuracy: 5, altitude: 10, speed: null },
      timestamp: 123,
    }),
    watchPosition: async () => "w0",
    clearWatch: async () => {},
  };
  const geo = createGeoCapability({ backend });
  const pos = await geo("getCurrentPosition", {}, ctx());
  assert.deepEqual(pos, {
    latitude: 49.3, longitude: -123.3, accuracy: 5,
    altitude: 10, altitudeAccuracy: null, heading: null, speed: null, timestamp: 123,
  });
});

test("geo.watchPosition streams tick:<id> events and clearWatch stops the native watch", async () => {
  let cb: ((pos: unknown, err?: unknown) => void) | undefined;
  let cleared: string | undefined;
  const backend: GeoBackend = {
    getCurrentPosition: async () => ({ coords: { latitude: 0, longitude: 0, accuracy: 1 }, timestamp: 0 }),
    watchPosition: async (_o, c) => { cb = c as typeof cb; return "native-7"; },
    clearWatch: async (id) => { cleared = id; },
  };
  const events: Array<[string, unknown]> = [];
  const geo = createGeoCapability({ backend });

  await geo("watchPosition", { watchId: 42, enableHighAccuracy: true }, ctx(events));
  cb?.({ coords: { latitude: 1, longitude: 2, accuracy: 3 }, timestamp: 9 });
  assert.deepEqual(events[0], ["tick:42", {
    latitude: 1, longitude: 2, accuracy: 3, altitude: null, altitudeAccuracy: null, heading: null, speed: null, timestamp: 9,
  }]);

  await geo("clearWatch", { watchId: 42 }, ctx());
  assert.equal(cleared, "native-7");
});

test("browser.open requires a url and calls the backend", async () => {
  const opened: string[] = [];
  const browser = createBrowserCapability({ backend: { open: async (url) => { opened.push(url); } } });
  await browser("open", { url: "https://cobd.ca" }, ctx());
  assert.deepEqual(opened, ["https://cobd.ca"]);
  await assert.rejects(() => Promise.resolve(browser("open", {}, ctx())), /url required/);
});

test("pdf.open maps file -> url and requires a backend", async () => {
  const opened: unknown[] = [];
  const pdf = createPdfCapability({ backend: { open: async (p) => { opened.push(p); } } });
  await pdf("open", { file: "/docs/a.pdf", title: "A" }, ctx());
  assert.deepEqual(opened, [{ url: "/docs/a.pdf", title: "A", top: undefined }]);
  await assert.rejects(() => Promise.resolve(pdf("open", {}, ctx())), /file required/);
  assert.throws(() => createPdfCapability(undefined as never), /requires a backend/);
});
