import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

await ensureFile('public/index.html');
await ensureFile('api/join.js');
await import(path.join(root, 'api/join.js'));

console.log('Build check passed. Static site and API entrypoint are ready.');

async function ensureFile(relativePath) {
  await access(path.join(root, relativePath));
}
