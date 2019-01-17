self = {
  postMessage: WebWorkerCore.onmessage,
  onmessage: data => console.error('onmessage not defined', data)
};

WebWorkerCore.setPostMessageMethod(data => {
  self.onmessage(new MessageEvent('worker', data));
});