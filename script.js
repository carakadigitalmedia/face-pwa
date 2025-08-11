// script.js - face detection (age + gender + expressions)
const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const info = document.getElementById('info');
const btnToggle = document.getElementById('btnToggle');
const ctx = overlay.getContext('2d');

let stream = null;
let running = false;
let loopId = null;

async function loadModels() {
  info.textContent = 'Memuat model (face detection, age/gender, expressions)...';
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
  info.textContent = 'Model siap. Mengaktifkan kamera...';
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = stream;
    await video.play();
    overlay.width = video.videoWidth || video.clientWidth;
    overlay.height = video.videoHeight || video.clientHeight;
    running = true;
    info.textContent = 'Kamera aktif. Menjalankan deteksi...';
    runDetectionLoop();
    btnToggle.textContent = 'Stop Camera';
  } catch (err) {
    console.error(err);
    info.textContent = 'Gagal mengakses kamera. Periksa izin dan koneksi HTTPS.';
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  running = false;
  if (loopId) cancelAnimationFrame(loopId);
  ctx.clearRect(0,0,overlay.width,overlay.height);
  info.textContent = 'Kamera berhenti.';
  btnToggle.textContent = 'Start Camera';
}

btnToggle.addEventListener('click', () => {
  if (running) stopCamera();
  else startSequence();
});

async function startSequence() {
  await loadModels();
  await startCamera();
}

async function runDetectionLoop() {
  if (!running) return;
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
  const detections = await faceapi.detectAllFaces(video, options)
    .withAgeAndGender()
    .withFaceExpressions();

  ctx.clearRect(0,0,overlay.width,overlay.height);

  if (detections && detections.length > 0) {
    detections.forEach(det => {
      const box = det.detection.box;
      // draw box
      ctx.strokeStyle = '#00ff99';
      ctx.lineWidth = Math.max(2, Math.round(box.width * 0.01));
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      // Age, gender, expression
      const age = Math.round(det.age);
      const gender = det.gender || '–';
      const genderProb = det.genderProbability ? (det.genderProbability*100).toFixed(0) + '%' : '';
      const topEmotion = Object.entries(det.expressions || { neutral: 0 })
        .sort((a,b)=>b[1]-a[1])[0];
      const emoLabel = topEmotion ? `${topEmotion[0]} ${(topEmotion[1]*100).toFixed(0)}%` : '';

      ctx.fillStyle = '#ffeb3b';
      ctx.font = '14px Arial';
      const text = `Usia: ${age} | ${gender} ${genderProb} | ${emoLabel}`;
      const x = box.x;
      const y = Math.max(14, box.y - 8);
      // background for readability
      const padding = 6;
      const metrics = ctx.measureText(text);
      const tw = metrics.width + padding*2;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x, y - 16, tw, 20);
      ctx.fillStyle = '#fff';
      ctx.fillText(text, x + padding, y);
    });
    info.textContent = `Terdeteksi ${detections.length} wajah`;
  } else {
    info.textContent = 'Tidak ada wajah terdeteksi';
  }

  loopId = requestAnimationFrame(runDetectionLoop);
}

// Auto start when page load (asks permission)
window.addEventListener('load', () => {
  // small delay to allow UI render
  setTimeout(() => startSequence(), 300);
});
