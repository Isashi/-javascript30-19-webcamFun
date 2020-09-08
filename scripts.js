const video = document.querySelector(".player");
const canvas = document.querySelector(".photo");
const bgcanvas = document.querySelector(".bgVideo");
const ctx = canvas.getContext("2d");
const tmp_ctx = bgcanvas.getContext("2d");
const strip = document.querySelector(".strip");
const snap = document.querySelector(".snap");
const selectedFilter = document.querySelector('input[name="filter"]:checked').value;

const bgVideo = document.createElement("video");
bgVideo.src = "./bgVideo.mp4";
bgVideo.muted = true;
bgVideo.autoplay = true;
bgVideo.loop = true;

function getVideo() {
	navigator.mediaDevices
		.getUserMedia({ video: true, audio: false })
		.then((mediaStream) => {
			video.srcObject = mediaStream;
			video.play();
		})
		.catch((err) => {
			console.error(err);
		});
}

function paintToCanvas() {
	const width = video.videoWidth;
	const height = video.videoHeight;
	canvas.width = width;
	canvas.height = height;
	bgcanvas.width = width;
	bgcanvas.height = height;

	return setInterval(() => {
    let selectedFilter = document.querySelector('input[name="filter"]:checked').value;

		ctx.drawImage(video, 0, 0, width, height);
    let pixels = ctx.getImageData(0, 0, width, height);

    if (selectedFilter === 'redFilter') { 
      pixels = redEffect(pixels)
    } else if (selectedFilter === 'rgbSplit') {
      pixels = rgbSplit(pixels)
    } else if (selectedFilter === 'greenScreen') {
      tmp_ctx.drawImage(bgVideo, 0, 0, width, height);
		  let bgPixels = tmp_ctx.getImageData(0, 0, width, height);
		  pixels = greenScreen(pixels, bgPixels);
    }

		ctx.putImageData(pixels, 0, 0);
	}, 16);
}

function takePhoto() {
	snap.currentTime = 0;
	snap.play();

	// take the data out of the canvas
	const data = canvas.toDataURL("image/jpeg");
	const link = document.createElement("a");
	link.href = data;
	link.setAttribute("download", "image");
	link.innerHTML = `<img src="${data}" alt="image"/>`;
	strip.insertBefore(link, strip.firstChild);
}

function redEffect(pixels) {
	for (let i = 0; i < pixels.data.length; i += 4) {
		// pixels.data[i] // red
		// pixels.data[i +1] // green
		// pixels.data[i + 2] // blue
		pixels.data[i + 0] = pixels.data[i + 0] + 100; // RED
		pixels.data[i + 1] = pixels.data[i + 1] - 50; // GREEN
		pixels.data[i + 2] = pixels.data[i + 2] * 0.5; // Blue
	}
	return pixels;
}

function rgbSplit(pixels) {
	for (let i = 0; i < pixels.data.length; i += 4) {
		pixels.data[i - 150] = pixels.data[i + 0]; // RED
		pixels.data[i + 100] = pixels.data[i + 1]; // GREEN
		pixels.data[i - 150] = pixels.data[i + 2]; // Blue
	}
	return pixels;
}

function greenScreen(pixels, bgPixels) {
	const levels = {};

  minColor = document.querySelector(".minColor input").value;
	levels["rmin"] = parseInt(minColor.substring(1, 3), 16);
	levels["gmin"] = parseInt(minColor.substring(3, 5), 16);
	levels["bmin"] = parseInt(minColor.substring(5, 7), 16);

  maxColor = document.querySelector(".maxColor input").value;
	levels["rmax"] = parseInt(maxColor.substring(1, 3), 16);
	levels["gmax"] = parseInt(maxColor.substring(3, 5), 16);
	levels["bmax"] = parseInt(maxColor.substring(5, 7), 16);

	for (i = 0; i < pixels.data.length; i = i + 4) {
		red = pixels.data[i + 0];
		green = pixels.data[i + 1];
		blue = pixels.data[i + 2];
		alpha = pixels.data[i + 3];

		if (
			red >= levels.rmin &&
			green >= levels.gmin &&
			blue >= levels.bmin &&
			red <= levels.rmax &&
			green <= levels.gmax &&
			blue <= levels.bmax
		) {
			// take it out!
			// pixels.data[i + 3] = 0;
			pixels.data[i] = bgPixels.data[i];
			pixels.data[i + 1] = bgPixels.data[i + 1];
			pixels.data[i + 2] = bgPixels.data[i + 2];
		}
	}

	return pixels;
}

getVideo();

video.addEventListener("canplay", paintToCanvas);
