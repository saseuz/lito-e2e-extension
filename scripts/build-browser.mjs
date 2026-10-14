import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [target = 'chromium', mode = 'production'] = process.argv.slice(2);
if (!['chromium', 'firefox', 'safari'].includes(target) || !['development', 'production'].includes(mode)) {
  throw new Error('Usage: node scripts/build-browser.mjs chromium|firefox|safari development|production');
}
const root = new URL('../', import.meta.url);
for (const [file, args] of [
  ['node_modules/typescript/bin/tsc', ['--noEmit']],
  ['node_modules/vite/bin/vite.js', ['build', '--mode', mode]],
]) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(file, root)), ...args], {
    cwd: fileURLToPath(root), stdio: 'inherit',
    env: { ...process.env, EXTENSION_TARGET: target },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
