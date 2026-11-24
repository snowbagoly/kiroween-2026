// Inlines src/ into one self-contained dist/index.html. No network calls allowed [R11.2].
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const entry = resolve(root, 'src/main.js');

// Minimal ES module bundler: follows relative imports, puts dependencies first,
// strips import lines and the `export` keyword. Top-level names must be unique across modules.
function bundle(file, seen = new Set(), out = []) {
  if (seen.has(file)) return out;
  seen.add(file);
  const src = readFileSync(file, 'utf8');
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

export function build() {
  let html = readFileSync(resolve(root, 'index.html'), 'utf8');
  const js = bundle(entry).join('\n\n').replace(/<\/script/gi, '<\\/script');
  html = html
    .replace(/<!-- build:js -->[\s\S]*?<!-- \/build:js -->/, () => `<script type="module">\n${js}\n</script>`)
    .replace(/<!-- build:css -->\n?/, '')
    .replace(/<!-- \/build:css -->\n?/, '');
  const bad = findExternalLinks(html);
  if (bad.length) throw new Error(`Build output links to other sites: ${bad.join(', ')}`);
  const dist = resolve(root, 'dist');
  if (!existsSync(dist)) mkdirSync(dist, { recursive: true });
  writeFileSync(resolve(dist, 'index.html'), html);
  return html;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    build();
    console.log('Wrote dist/index.html');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
