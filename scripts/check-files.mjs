// scripts/check-files.mjs
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CUSTOMIZE_PATH = path.join(ROOT, "app", "customize", "page.tsx");

// 你目前檔名規則：
// single:  label_lang_style.ext   e.g. courage_tc_SA.svg
// phrase:  label_phrase_lang_style.ext   e.g. fate_phrase_tc_SC.svg
const makeName = ({ label, isPhrase, lang, style, ext }) =>
  `${label}${isPhrase ? "_phrase" : ""}_${lang}_${style}.${ext}`;

const toSlug = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// 讀取 customize/page.tsx，粗略抽取 THEMES id + options label + isExclusive
function parseThemesFromCustomize(tsxText) {
  const themes = [];
  const themeBlockRe = /\{\s*id:\s*'([^']+)'\s*,[\s\S]*?options:\s*\[([\s\S]*?)\]\s*,\s*\}/g;
  let m;

  while ((m = themeBlockRe.exec(tsxText))) {
    const themeId = m[1];
    const block = m[0];
    const optionsBlock = m[2];
    const isExclusive = /isExclusive:\s*true/.test(block);

    const labels = [];
    const labelRe = /label:\s*'([^']+)'/g;
    let lm;
    while ((lm = labelRe.exec(optionsBlock))) labels.push(lm[1]);

    themes.push({ themeId, isExclusive, labels });
  }

  return themes;
}

function listAllFiles(dir) {
  const out = [];
  const walk = (p) => {
    if (!fs.existsSync(p)) return;
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(p)) walk(path.join(p, name));
    } else {
      out.push(p);
    }
  };
  walk(dir);
  return out;
}

function relFromDesigns(absPath) {
  const designsRoot = path.join(ROOT, "storage", "designs");
  return path.relative(designsRoot, absPath).replaceAll("\\", "/");
}

// 只檢查 premium_png + premium_svg（你而家最常出錯嗰兩個）
const TARGETS = [
  { folder: "premium_png", ext: "png" },
  { folder: "premium_svg", ext: "svg" },
];

// premium 支援 tc + sc，style 有 SA/SB/SC
const LANGS = ["tc", "sc"];
const STYLES = ["SA", "SB", "SC"];

const main = () => {
  const tsx = fs.readFileSync(CUSTOMIZE_PATH, "utf8");
  const themes = parseThemesFromCustomize(tsx);

  if (!themes.length) {
    console.error("❌ 無法從 app/customize/page.tsx 解析 THEMES。你檔案位置或格式可能唔同。");
    process.exit(1);
  }

  for (const target of TARGETS) {
    const baseDir = path.join(ROOT, "storage", "designs", target.folder);
    const actual = new Set(
      listAllFiles(baseDir)
        .filter((p) => p.toLowerCase().endsWith("." + target.ext))
        .map((p) => relFromDesigns(p))
    );

    const expected = new Set();

    for (const t of themes) {
      for (const rawLabel of t.labels) {
        const label = toSlug(rawLabel);

        // exclusive theme：只允許 phrase
        const phraseModes = t.isExclusive ? [true] : [false, true];

        for (const isPhrase of phraseModes) {
          for (const lang of LANGS) {
            for (const style of STYLES) {
              const file = makeName({ label, isPhrase, lang, style, ext: target.ext });
              expected.add(`${target.folder}/${t.themeId}/${file}`);
            }
          }
        }
      }
    }

    const missing = [...expected].filter((x) => !actual.has(x));
    const extra = [...actual].filter((x) => !expected.has(x));

    console.log("\n==============================");
    console.log(`✅ CHECK: ${target.folder} (*.${target.ext})`);
    console.log(`Expected: ${expected.size} | Actual: ${actual.size}`);
    console.log("------------------------------");

    console.log(`\n❌ Missing (${missing.length})`);
    missing.slice(0, 80).forEach((x) => console.log("  -", x));
    if (missing.length > 80) console.log(`  ... (${missing.length - 80} more)`);

    console.log(`\n⚠️ Extra/Unreferenced (${extra.length})`);
    extra.slice(0, 80).forEach((x) => console.log("  -", x));
    if (extra.length > 80) console.log(`  ... (${extra.length - 80} more)`);
  }
};

main();