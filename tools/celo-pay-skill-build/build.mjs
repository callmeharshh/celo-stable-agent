import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "..", "skills", "built-in", "celo-pay", "scripts");
mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [join(here, "src", "skill.js")],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  outfile: join(outDir, "bundle.js"),
});

console.log(`Built skill bundle -> ${join(outDir, "bundle.js")}`);
