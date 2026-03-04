// scripts/build-mystery-pool.mjs
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const baseDir = path.join(ROOT, "storage", "designs", "standard_png");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(baseDir)
  .filter((p) => p.toLowerCase().endsWith(".png"))
  // 只儲存相對於 standard_png 的路徑，例如 "love/love_phrase_tc_SA.png"
  .map((p) => path.relative(baseDir, p).replaceAll("\\", "/"));

fs.mkdirSync(path.join(ROOT, "storage", "manifests"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "storage", "manifests", "mystery_pool_standard_png.json"),
  JSON.stringify({ files }, null, 2),
  "utf-8"
);

console.log("✅ Mystery pool built:", files.length);