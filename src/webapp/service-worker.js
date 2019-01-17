self.addEventListener('install', event => {
  console.log('[ServiceWorker]:install.4');
});

self.addEventListener('activate', event => {
  console.log('[ServiceWorker]:activate.4', event);
});

self.addEventListener('fetch', event => {
  console.log('[ServiceWorker]:fetch.4', event);
});

console.log('?4');