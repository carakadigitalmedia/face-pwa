const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const info = document.getElementById('info');
const ctx = overlay.getContext('2d');

// Fungsi minta izin kamera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" }, // kamera depan
      audio: false
    });
    video.srcObject = stream;
    info.textContent = "Kamera aktif, memuat model...";
    await loadModels();
  } catch (err) {
    console.error(err);
    info.textContent = "Izin kamera ditolak atau tidak tersedia.";
  }
}

// Load model face-api.js
async function loadModels() {
  const MODEL_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights";
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
  info.textContent = "Model siap, mendeteksi wajah...";
  detectFace();
}

// Deteksi wajah dan usia
async function detectFace() {
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(overlay, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withAgeAndGender();

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const resized = faceapi.resizeResults(detections, displaySize);
    faceapi.draw.drawDetections(overlay, resized);

    resized.forEach(det => {
      const { age, gender, genderProbability } = det;
      ctx.font = "14px Arial";
      ctx.fillStyle = "yellow";
      ctx.fillText(
        `${Math.round(age)} tahun, ${gender} (${(genderProbability*100).toFixed(1)}%)`,
        det.detection.box.x,
        det.detection.box.y - 10
      );
    });
  }, 500);
}

// Mulai kamera saat halaman load
window.addEventListener('load', startCamera);
