import { showMessageBox } from "./helpers/messagebox.js";

export default class Renderer {
  constructor(app) {
    this.app = app;
  }

  render() {
    this.app.ctx.save();
    this.app.ctx.clearRect(0, 0, this.app.canvas.width, this.app.canvas.height);

    this.app.ctx.scale(this.app.viewport.zoom, this.app.viewport.zoom);
    this.app.ctx.translate(this.app.viewport.x, this.app.viewport.y);

    this.app.getCurrentFrame().draw(this.app.ctx);

    if (this.app.currentShape) {
      this.app.currentShape.draw(this.app.ctx);
    }

    this.app.ctx.restore();
    this.app.selectionTransformer.showSelectionHandles(this.app.ctx);

    this.app.getCurrentFrame().generateThumbnail(this.app.canvas);
  }

  resetZoom() {
    this.app.viewport.zoom = 1;
    this.app.viewport.x = 0;
    this.app.viewport.y = 0;
    this.render();
  }

  exportFrame(format, bg = "transparent") {
    if (format === "png") {
      const originalCtx = this.app.ctx;
      const canvas = this.app.canvas;

      // Create an off-screen canvas
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const exportCtx = exportCanvas.getContext("2d");

      // Optional: apply same zoom/pan if needed
      exportCtx.save();
      if (bg === "white") {
        exportCtx.fillStyle = "#fff";
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      }

      exportCtx.scale(this.app.viewport.zoom, this.app.viewport.zoom);
      exportCtx.translate(this.app.viewport.x, this.app.viewport.y);

      // Draw all shapes
      this.app.getCurrentFrame().draw(exportCtx);

      exportCtx.restore();

      // Create image
      const image = exportCanvas.toDataURL("image/png");

      // Trigger download
      const link = document.createElement("a");
      link.href = image;
      link.download = "sketch.png";
      link.click();
    } else if (format === "svg") {
      showMessageBox(
        "SVG export functionality needs to be implemented with SVG serialization."
      );
    }
  }

  exportAnimation() {
    // Check if MediaRecorder and canvas.captureStream are supported
    if (!this.app.canvas.captureStream || !window.MediaRecorder) {
      showMessageBox(
        "Video export is not supported in this browser. Please use a modern browser with MediaRecorder and CanvasCaptureMediaStream support."
      );
      return;
    }
    this.app.fps = parseInt(document.getElementById("fpsInput").value);

    // Set up the canvas stream
    const stream = this.app.canvas.captureStream(this.app.fps);
    const recordedChunks = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm",
    });

    // Handle data as it's recorded
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    // When recording stops, create a downloadable video
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `animation_${Date.now()}.webm`;
      link.click();
      URL.revokeObjectURL(url);
    };

    // Start recording
    mediaRecorder.start();

    // Play through each frame
    let frameIndex = 0;
    const frameDuration = 1000 / this.app.fps; // Duration per frame in milliseconds

    const playNextFrame = () => {
      if (frameIndex >= this.app.frames.length) {
        mediaRecorder.stop();
        return;
      }

      // Set current frame and render
      this.app.currentFrameIndex = frameIndex;
      this.render();

      // Move to next frame after the appropriate duration
      setTimeout(() => {
        frameIndex++;
        playNextFrame();
      }, frameDuration);
    };

    // Start the frame sequence
    playNextFrame();
  }
}
