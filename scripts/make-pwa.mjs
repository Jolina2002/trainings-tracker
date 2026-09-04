// Macht aus dem `expo export -p web`-Ergebnis eine installierbare Web-App
// und erzeugt zusätzlich eine Einzeldatei-Version.
//
//   npx expo export -p web && node scripts/make-pwa.mjs
//
import { readFileSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const NAME = 'Trainings-Tracker';
const BG = '#0D0F13';
const CHROME = '#171A21';   // Farbe der Tab-Leiste
const THEME = '#0D0F13';

const bundle = readdirSync(join(DIST, '_expo/static/js/web')).find((f) => f.endsWith('.js'));
if (!bundle) throw new Error('Kein JS-Bundle in dist/ gefunden – lief `expo export -p web`?');
const bundlePath = join(DIST, '_expo/static/js/web', bundle);
const js = readFileSync(bundlePath, 'utf8');

const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const reset = html.match(/<style id="expo-reset">[\s\S]*?<\/style>/)?.[0] ?? '';

/* ---------- 1. manifest + Service Worker + Icons ---------- */

const manifest = {
  name: NAME,
  short_name: NAME,
  start_url: '.',
  scope: '.',
  display: 'standalone',
  orientation: 'portrait',
  background_color: CHROME,
  theme_color: CHROME,
  icons: [
    { src: 'pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  ],
};
writeFileSync(join(DIST, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

for (const f of ['pwa-icon-192.png', 'pwa-icon-512.png', 'apple-touch-icon.png']) {
  copyFileSync(join('assets', f), join(DIST, f));
}

// GitHub Pages laesst Jekyll laufen, das Ordner mit fuehrendem _ ignoriert (_expo/).
writeFileSync(join(DIST, '.nojekyll'), '');

// Cache-first: nach dem ersten Öffnen läuft die App ohne Netz.
const CACHE = `trainings-tracker-${bundle.replace(/\D/g, '').slice(0, 12)}`;
writeFileSync(join(DIST, 'sw.js'), `const CACHE = ${JSON.stringify(CACHE)};
const ASSETS = ['./', './index.html', './_expo/static/js/web/${bundle}',
  './manifest.webmanifest', './pwa-icon-192.png', './pwa-icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
    return res;
  }).catch(() => caches.match('./index.html'))));
});
`);

/* ---------- 2. index.html aufbohren ---------- */

const head = `
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
    <meta name="theme-color" content="${THEME}" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="${NAME}" />
    <link rel="manifest" href="manifest.webmanifest" />
    <link rel="apple-touch-icon" href="apple-touch-icon.png" />
    <style>
      html, body { background: ${CHROME}; overscroll-behavior: none; }
      /* inset:0 bezieht sich auf das visuelle Viewport – mit viewport-fit=cover
         reicht das bis unter die Home-Indicator-Leiste. height muss dafuer weg,
         sonst gewinnt das height:100% aus dem Expo-Reset. */
      #root { position: fixed; inset: 0; height: auto; display: flex; }
    </style>`;

let out = html
  .replace(/<meta name="viewport"[^>]*>/, '')
  .replace('</head>', `${head}\n  </head>`)
  .replace(/(src|href)="\/(?!\/)/g, '$1="')          // absolute Pfade -> relativ
  .replace('</body>', `  <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
      }
    </script>
  </body>`);
writeFileSync(join(DIST, 'index.html'), out);

/* ---------- 3. Einzeldatei-Varianten ---------- */

const inlineJs = js.replaceAll('</script', '<\\/script');
const body = `<title>${NAME}</title>
${reset}
<style>
  html, body { background: ${BG}; margin: 0; overscroll-behavior: none; }
  #root { position: fixed; inset: 0; display: flex; }
</style>
<div id="root"></div>
<script>${inlineJs}</script>`;

writeFileSync(join(DIST, 'artifact.html'), body);
writeFileSync(join(DIST, 'standalone.html'),
  `<!DOCTYPE html>\n<html lang="de">\n<head>\n<meta charset="utf-8" />${head}\n</head>\n<body>\n${body}\n</body>\n</html>`);

console.log(`fertig:
  dist/                  installierbare Web-App (hosten und "Zum Home-Bildschirm")
  dist/standalone.html   alles in einer Datei (${Math.round(Buffer.byteLength(body) / 1024)} KB)
  dist/artifact.html     dieselbe Datei ohne <html>/<head> für den Artifact-Upload`);
