document.getElementById('captureButton').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: captureScreen
    });
  });
});

function captureScreen() {
  chrome.runtime.sendMessage({ action: 'captureScreen' });
}
