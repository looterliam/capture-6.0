chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreen') {
    chrome.desktopCapture.chooseDesktopMedia(["screen", "window"], sender.tab, (streamId) => {
      if (!streamId) {
        console.log("The user canceled the request.");
        return;
      }
      navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: streamId
          }
        }
      }).then((stream) => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imgUrl = canvas.toDataURL();
          downloadImage(imgUrl);
          stream.getTracks()[0].stop();
        };
      }).catch((err) => {
        console.error("Error: " + err);
      });
    });
  }
});

function downloadImage(dataUrl) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'screenshot.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
