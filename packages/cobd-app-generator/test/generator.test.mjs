import test from "node:test";
import assert from "node:assert/strict";

import {
  planSteps, renderCapacitorConfig, renderProjectPackageJson,
  validateBrand, validateConfig, validateMenu,
} from "../src/lib.mjs";

test("validateBrand accepts a reverse-DNS appId and requires appName", () => {
  const b = validateBrand({ appId: "ca.cobd.app.alpha", appName: "Alpha" }, "alpha");
  assert.equal(b.appId, "ca.cobd.app.alpha");
  assert.equal(b.appName, "Alpha");
  assert.throws(() => validateBrand({ appId: "nope", appName: "X" }, "x"), /reverse-DNS/);
  assert.throws(() => validateBrand({ appId: "ca.cobd.x" }, "x"), /appName/);
});

test("validateMenu accepts array or { items } and requires label+target", () => {
  assert.equal(validateMenu([{ label: "Home", target: "/" }]).length, 1);
  assert.equal(validateMenu({ items: [{ label: "A", target: "/a" }] }).length, 1);
  assert.throws(() => validateMenu([{ label: "no target" }]), /target/);
  assert.throws(() => validateMenu("nope"), /expected an array/);
});

test("validateConfig defaults platforms and rejects unknown ones", () => {
  assert.deepEqual(validateConfig({ capacitorVersion: "8.4.0" }).platforms, ["android", "ios"]);
  assert.throws(() => validateConfig({ capacitorVersion: "8", platforms: ["web"] }), /unknown platform/);
});

test("planSteps states approach D in order and pins the version", () => {
  const config = validateConfig({ capacitorVersion: "8.4.0", outDir: ".generated", base: { buildCommand: "npm run build -w x" } });
  const brand = validateBrand({ appId: "ca.cobd.app.alpha", appName: "Alpha" }, "alpha");
  const steps = planSteps({ config, app: "alpha", brand });
  const ids = steps.map((s) => s.id);
  assert.deepEqual(ids, [
    "clean", "build-web", "assemble-web", "scaffold", "install",
    "cap-add", "overlay-native", "assets", "cap-sync", "build-sign",
  ]);
  assert.match(steps.find((s) => s.id === "scaffold").desc, /pinned 8\.4\.0/);
  assert.match(steps.find((s) => s.id === "scaffold").desc, /ca\.cobd\.app\.alpha/);
});

test("rendered capacitor.config.ts + package.json carry the brand and pin", () => {
  const config = validateConfig({ capacitorVersion: "8.4.0" });
  const brand = validateBrand({ appId: "ca.cobd.app.alpha", appName: "Alpha" }, "alpha");
  const cfg = renderCapacitorConfig(brand);
  assert.match(cfg, /appId: "ca\.cobd\.app\.alpha"/);
  assert.match(cfg, /appName: "Alpha"/);
  const pkg = JSON.parse(renderProjectPackageJson(brand, config));
  assert.equal(pkg.name, "ca-cobd-app-alpha");
  assert.equal(pkg.dependencies["@capacitor/core"], "^8.4.0");
});
