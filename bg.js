console.log('loaded');

var requests = {};

function onRequest(details) {
  console.log('request captured');
  console.log(details);
}

function onResponse(details) {
  console.log('response captured');
  console.log(details);
}

function onError(details) {
  console.log('error captured');
  console.log(details);
}

function startCapture(_tabIdFilter) {
  requests = [];
  var filter = { urls: ["<all_urls>"], tabId: _tabIdFilter };
  // chrome.webRequest.onBeforeRequest.addListener( onRequest, filter, ['requestBody'] );
  // chrome.webRequest.onCompleted.addListener( onResponse, filter );
  // chrome.webRequest.onErrorOccurred.addListener( onError, filter );
  currentPort.postMessage({ msg: 'startCapture' });
}

function stopCapture() {
  // chrome.webRequest.onBeforeRequest.removeListener(onRequest);
  // chrome.webRequest.onCompleted.removeListener(onResponse);
  // chrome.webRequest.onErrorOccurred.removeListener(onError);
  currentPort.postMessage({ msg: 'stopCapture' });

  console.log(requests);

  var blob = new Blob([JSON.stringify(requests)], {type: "application/json;charset=utf-8"});
  saveAs(blob, "hello world.json");

  // var toSave = requests;
  // chrome.fileSystem.chooseEntry({
  //   type: 'saveFile',
  //   suggestedName: 'capture.json'
  // }, function(_entry) {
  //   _entry.createWriter(function(writer) {
  //     writer.write(JSON.stringify(toSave));
  //   });
  // });

  requests = null;
}

// setup devtools messaging, use this for now ...
// (until https://code.google.com/p/chromium/issues/detail?id=104058 is released)

var connectedPorts = {}, currentPort;

chrome.runtime.onConnect.addListener(function(port) {
  if(port.name == "browser-capture") {
    console.log('incomming devtools connection!');
    console.log(port);

    var tabId;

    port.onMessage.addListener(function(msg) {
      switch(msg.msg) {
      case 'register':
        tabId = msg.tabId;
        console.log('port registered for tag ' + tabId);
        connectedPorts[tabId] = port;
        break;
      case 'content':
        // TODO: make sure port is active one.
        var res = msg.resource;
        requests.push({
          method: res.request.method,
          url: res.request.url,
          sent_headers: res.request.headers,
          recv_headers: res.response.headers,
          body: '',
          content: msg.content,
          content_encoding: msg.encoding
        });

        console.log('resource captured');
        console.log(msg.resource);
        console.log(msg.encoding);
        break;
      }
    });

    port.onDisconnect.addListener(function() {
      if(tabId) delete connectedPorts[tabId];
    });
  }
});

// Main capture logic
var currentTabId = null;
chrome.browserAction.onClicked.addListener(function(tab) {

  if(currentTabId) {
    // stop capturing if already capturing
    console.log('stopped capturing on tab ' + currentTabId);
    stopCapture();
  }

  if(tab.id) {
    if(currentTabId == tab.id) {
      currentTabId = null;
      currentPort = null;
    } else {
      currentPort = connectedPorts[tab.id];
      if(currentPort) {
        // start capturing on current tab
        currentTabId = tab.id;
        console.log('capturing on tab ' + currentTabId);
        startCapture(currentTabId);
      } else {
        console.log('could not find devtools port for tab ' + tab.id);
      }
    }
  } else {
    // log or alert
  }

});

