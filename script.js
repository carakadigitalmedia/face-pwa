const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const info = document.getElementById('info');
const ctx = overlay.getContext('2d');

async function loadModels() {
  const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
  info.textContent = 'Memuat model (face detection, expressions, age/gender)...';
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
  await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
  info.textContent = 'Model siap. Mengakses kamera...';
  startVideo();
}

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    .then(stream => {
      video.srcObject = stream;
      video.play();
    })
    .catch(err => {
      console.error(err);
      info.textContent = 'Error mengakses kamera: ' + err.message;
    });
}

video.addEventListener('play', () => {
  overlay.width = video.videoWidth || video.clientWidth;
  overlay.height = video.videoHeight || video.clientHeight;

  const loop = async () => {
    if (video.paused || video.ended) return;
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions()
      .withAgeAndGender();

    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (detections && detections.length > 0) {
      detections.forEach(det => {
        const box = det.detection.box;
        ctx.strokeStyle = '#00ff99';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
      });
      faceapi.draw.drawFaceExpressions(overlay, detections);

      const d = detections[0];
      const age = d.age ? d.age.toFixed(0) : '–';
      const gender = d.gender || '–';
      const topEmotion = Object.entries(d.expressions || {neutral:0})
        .sort((a,b)=>b[1]-a[1])[0];
      const emoName = topEmotion ? topEmotion[0] : '–';
      const emoProb = topEmotion ? (topEmotion[1]*100).toFixed(1) : '0.0';

      info.textContent = `Usia: ${age} | Gender: ${gender} | Ekspresi: ${emoName} (${emoProb}%)`;
    } else {
      info.textContent = 'Tidak ada wajah terdeteksi';
    }
    requestAnimationFrame(loop);
  };
  loop();
});

// Register service worker if available
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(()=>{});
}

loadModels();
