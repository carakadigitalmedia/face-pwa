async function detectAge() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.ageGenderNet.loadFromUri('/models');

    const video = document.getElementById('camera');

    video.addEventListener('play', () => {
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withAgeAndGender();
            const resized = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resized);

            detections.forEach(d => {
                const { age, gender } = d;
                const roundedAge = Math.round(age);
                new faceapi.draw.DrawTextField(
                    [`Usia: ${roundedAge}`, `Gender: ${gender}`],
                    d.detection.box.bottomRight
                ).draw(canvas);
            });
        }, 1000);
    });
}
