import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const endpoint = env.VITE_API_URL || (mode === 'development' ? 'http://localhost:8000/api/v1/dictionary/lookup' : '');
  if (!endpoint) throw new Error('Set VITE_API_URL for a production build.');
  const url = new URL(endpoint);
  if (url.username || url.password || url.search || url.hash || !['http:', 'https:'].includes(url.protocol)) throw new Error('API URL must be an HTTP(S) endpoint without credentials, query, or fragment.');
  if (mode !== 'development' && url.protocol !== 'https:') throw new Error('Production API must use HTTPS.');
  return {
    base: './',
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify(endpoint) },
    plugins: [tailwindcss(), {
      name: 'extension-manifest',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'manifest.json', source: JSON.stringify({
          manifest_version: 3, name: 'Lito E2E', version: '0.1.0',
          description: 'Look up English words through Lito with Merriam-Webster definitions.',
          action: { default_popup: 'index.html', default_title: 'Lito E2E' },
          permissions: ['contextMenus'],
          background: { service_worker: 'background.js' },
          host_permissions: [`${url.protocol}//${url.hostname}/*`],
          content_security_policy: { extension_pages: `script-src 'self'; object-src 'self'; connect-src ${url.origin};` },
        }, null, 2) });
      },
    }],
  };
});
