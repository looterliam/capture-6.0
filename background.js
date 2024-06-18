chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreen') {
    chrome.desktopCapture.chooseDesktopMedia(["screen", "window"], sender.tab, (streamId) => {
      if (!streamId) {
        console.log("The user canceled the request.");
        return;
      }

      // Send a message to the content script to capture the screen with the provided streamId
      chrome.tabs.sendMessage(sender.tab.id, { action: 'startCapture', streamId: streamId, area: request.area });
    });
  }
});
