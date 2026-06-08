// Copy non-TS assets (the Handlebars template) from src/assets/
// into dist/assets/ after tsc, so the published package can read
// the template relative to the compiled generate.js. Node stdlib
// only, matching the rest of the workspace's build scripts.

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const src = resolve(root, "src/assets");
const dest = resolve(root, "dist/assets");

if (!existsSync(src)) {
    console.log("oister: no src/assets/ to copy");
    process.exit(0);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("oister: assets copied -> dist/assets/");
