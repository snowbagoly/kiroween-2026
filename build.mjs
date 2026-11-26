// Inlines src/ into one self-contained dist/index.html. No network calls allowed [R11.2].
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

// Minimal ES module bundler: follows relative imports, puts dependencies first,
// strips import lines and the `export` keyword. Top-level names must be unique across modules.
function bundle(file, seen = new Set(), out = []) {
  if (seen.has(file)) return out;
  seen.add(file);
  const src = readFileSync(file, 'utf8');
  // Namespace imports would be stripped and leave the name undefined in the one scope.
  if (/^\s*import\s+\*\s+as\s/m.test(src)) throw new Error(`${relative(root, file)}: use named imports, not import * as`);
  const importRe = /^\s*import\s+(?:[^'"]*?\s+from\s+)?['"](\.[^'"]+)['"]\s*;?\s*$/gm;
  for (const m of src.matchAll(importRe)) bundle(resolve(dirname(file), m[1]), seen, out);
  const code = src
    .replace(importRe, '')
    .replace(/^export\s+default\s+/gm, 'const __default = ')
    .replace(/^export\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/gm, '')
    .replace(/^export\s*\{[^}]*\}\s*;?\s*$/gm, '');
  out.push(`// ${relative(root, file)}\n${code.trim()}`);
  return out;
}

// Links to other sites are not allowed. XML namespace URIs (w3.org) are not links.
export function findExternalLinks(text) {
  const found = text.match(/https?:\/\/[^\s"'<>)]+/g) ?? [];
  return found.filter((u) => !/^https?:\/\/www\.w3\.org\//.test(u));
}

// The bundle puts every module in one scope, so two modules must not declare the same
// top-level name. Returns the names declared more than once.
export function findDuplicateNames(js) {
  const seen = new Map();
  for (const m of js.matchAll(/^(?:const|let|var|function\*?|class|async\s+function)\s+([A-Za-z_$][\w$]*)/gm)) {
    seen.set(m[1], (seen.get(m[1]) ?? 0) + 1);
  }
  return [...seen].filter(([, n]) => n > 1).map(([name]) => name);
}

// Pages to build: [html template, entry script, output file]. Dev pages are for manual checks.
export const PAGES = [
  ['index.html', 'src/main.js', 'index.html'],
  ['dev/audio.html', 'dev/audio.js', 'dev-audio.html'],
  ['index.html', 'dev/send.js', 'dev-send.html'],
  ['dev/night.html', 'dev/night.js', 'dev-night.html'],
];

// A stylesheet inlined as <style>, with each url(./file) it names (the fonts) as a base64 data URI,
// so the page loads nothing else [R11.2].
export function inlineCss(cssFile) {
  const dir = dirname(cssFile);
  const css = readFileSync(cssFile, 'utf8').replace(/url\((\.\/[^)]+\.woff2)\)/g, (_, f) =>
    `url(data:font/woff2;base64,${readFileSync(resolve(dir, f)).toString('base64')})`);
  return `<style>\n${css}\n</style>`;
}

export function buildPage(htmlFile, entryFile, outFile) {
  let html = readFileSync(resolve(root, htmlFile), 'utf8');
  const htmlDir = dirname(resolve(root, htmlFile));
  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => inlineCss(resolve(htmlDir, href)));
  const js = bundle(resolve(root, entryFile)).join('\n\n').replace(/<\/script/gi, '<\\/script');
  const dup = findDuplicateNames(js);
  if (dup.length) throw new Error(`${entryFile}: these top-level names are declared in more than one module: ${dup.join(', ')}`);
  html = html
    .replace(/<!-- build:js -->[\s\S]*?<!-- \/build:js -->/, () => `<script type="module">\n${js}\n</script>`)
    .replace(/<!-- build:css -->\n?/, '')
    .replace(/<!-- \/build:css -->\n?/, '');
  const bad = findExternalLinks(html);
  if (bad.length) throw new Error(`Build output links to other sites: ${bad.join(', ')}`);
  const dist = resolve(root, 'dist');
  if (!existsSync(dist)) mkdirSync(dist, { recursive: true });
  writeFileSync(resolve(dist, outFile), html);
  return html;
}

export function build() {
  let main = '';
  for (const [h, e, o] of PAGES) {
    const html = buildPage(h, e, o);
    if (o === 'index.html') main = html;
  }
  return main;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    build();
    console.log(`Wrote ${PAGES.map((p) => 'dist/' + p[2]).join(', ')}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
