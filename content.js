let startX, startY, endX, endY;
let isSelecting = false;
let selectionDiv;

function onMouseDown(e) {
  if (e.button !== 0) return; // Only react to left mouse button
  startX = e.clientX;
  startY = e.clientY;
  isSelecting = true;
  selectionDiv = document.createElement('div');
  selectionDiv.style.position = 'absolute';
  selectionDiv.style.border = '2px dashed #000';
  selectionDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
  document.body.appendChild(selectionDiv);
}

function onMouseMove(e) {
  if (!isSelecting) return;
  endX = e.clientX;
  endY = e.clientY;
  selectionDiv.style.left = `${Math.min(startX, endX)}px`;
  selectionDiv.style.top = `${Math.min(startY, endY)}px`;
  selectionDiv.style.width = `${Math.abs(endX - startX)}px`;
  selectionDiv.style.height = `${Math.abs(endY - startY)}px`;
}

function onMouseUp(e) {
  if (!isSelecting) return;
  isSelecting = false;
  document.body.removeChild(selectionDiv);
  const selectedArea = {
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY)
  };
  chrome.runtime.sendMessage({ action: 'captureScreen', area: selectedArea });

  // Remove event listeners after capture
  document.removeEventListener('mousedown', onMouseDown);
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startCapture') {
    const streamId = request.streamId;
    const area = request.area;

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
        cropAndDownloadImage(imgUrl, area);
        stream.getTracks()[0].stop();
      };
    }).catch((err) => {
      console.error("Error: " + err);
    });
  }

  if (request.action === 'initiateCapture') {
    // Add event listeners to start capturing
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
});

function cropAndDownloadImage(dataUrl, area) {
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = area.width;
    canvas.height = area.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
    const croppedDataUrl = canvas.toDataURL();
    const a = document.createElement('a');
    a.href = croppedDataUrl;
    a.download = 'screenshot.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  image.src = dataUrl;
}
