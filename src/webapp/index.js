function importScript(url) {
  let s = document.createElement('script');

  s.type = 'text/javascript';
  s.async = true;
  s.src = url;
  document.getElementsByTagName('head')[0].appendChild(s);
}

// if (navigator.serviceWorker) {
//   navigator.serviceWorker.register('service-worker.js');
//   console.log('support');
// } else {
//   importScript('service-worker-dummy.js');
// }
console.log('hello world');
