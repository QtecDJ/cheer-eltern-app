import fs from 'fs';
import path from 'path';

function readDirRecursive(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      readDirRecursive(full, files);
    } else if (e.isFile() && /\.(ts|tsx|js|jsx)$/.test(e.name)) {
      files.push(full);
    }
  }
  return files;
}

const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1'));
const root = path.join(__dirname, '..', 'src');
const files = readDirRecursive(root);
const exportRegex = /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/g;
const exports = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = exportRegex.exec(content)) !== null) {
    exports.push({ name: m[1], file });
  }
}

function countOccurrences(name) {
  let count = 0;
  for (const f of files) {
    const c = fs.readFileSync(f, 'utf8');
    const regex = new RegExp('\\b' + name + '\\b', 'g');
    const matches = c.match(regex);
    if (matches) count += matches.length;
  }
  return count;
}

const results = exports.map(e => ({ name: e.name, file: path.relative(process.cwd(), e.file), occurrences: countOccurrences(e.name) }));

// Filter exported functions that appear only once (their own definition)
const unused = results.filter(r => r.occurrences <= 1).sort((a,b) => a.name.localeCompare(b.name));

console.log('Found exported functions:', results.length);
console.log('Potentially unused exports (occurrences <=1):');
unused.forEach(u => console.log(`${u.name} — ${u.file} — occurrences: ${u.occurrences}`));

// Also print a short CSV for later use
console.log('\nCSV: name,file,occurrences');
unused.forEach(u => console.log(`${u.name},${u.file},${u.occurrences}`));
