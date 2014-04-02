chrome.devtools.panels.create("Capture", "/icon.png", "/panel.html", function(extensionPanel) {
    var _window; // Going to hold the reference to panel.html's `window`

    var port = chrome.extension.connect({ name: "browser-capture" });

    port.postMessage({
      msg: 'register',
      tabId: chrome.devtools.inspectedWindow.tabId
    });

    // proxy function, forwards resource information to background process.
    function capture(resource) {
      resource.getContent(function(content, encoding) {
          port.postMessage({
            msg: 'content',
            resource: resource,
            content: content,
            encoding: encoding
          });
      });
    }

    port.onMessage.addListener(function(msg) {
      if(msg.msg == 'startCapture') {
        chrome.devtools.network.onRequestFinished.addListener(capture);
      } else if(msg.msg == 'stopCapture') {
        chrome.devtools.network.onRequestFinished.removeListener(capture);
      }
    });
});