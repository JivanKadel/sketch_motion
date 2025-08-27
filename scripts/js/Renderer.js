import { showMessageBox } from "./helpers/messagebox.js";

// Handles rendering of the canvas and shapes
export default class Renderer {
  constructor(app) {
    this.app = app;
  }

  // render() {
  //   this.app.ctx.save();
  //   this.app.ctx.clearRect(0, 0, this.app.canvas.width, this.app.canvas.height);

  //   this.app.ctx.scale(this.app.viewport.zoom, this.app.viewport.zoom);
  //   this.app.ctx.translate(this.app.viewport.x, this.app.viewport.y);

  //   // Onion skinning: show previous/next frames if enabled and not exporting
  //   if (this.app.onionSkinEnabled && !this.app.isExporting) {
  //     // Previous frame
  //     if (this.app.currentFrameIndex > 0) {
  //       this.app.ctx.save();
  //       this.app.ctx.globalAlpha = 0.3;
  //       this.app.frames[this.app.currentFrameIndex - 1].draw(this.app.ctx);
  //       this.app.ctx.restore();
  //     }
  //     // Next frame
  //     if (this.app.currentFrameIndex < this.app.frames.length - 1) {
  //       this.app.ctx.save();
  //       this.app.ctx.globalAlpha = 0.3;
  //       this.app.frames[this.app.currentFrameIndex + 1].draw(this.app.ctx);
  //       this.app.ctx.restore();
  //     }
  //   }

  //   // Draw current frame
  //   this.app.getCurrentFrame().draw(this.app.ctx);

  //   if (this.app.currentShape) {
  //     this.app.currentShape.draw(this.app.ctx);
  //   }

  //   this.app.ctx.restore();

  //   // Only show selection handles when in select mode and shapes are selected
  //   if (
  //     this.app.currentTool === "select" &&
  //     this.app.selectedShapes.length > 0
  //   ) {
  //     this.app.selectionTransformer.showSelectionHandles(this.app.ctx);
  //   }

  //   this.app.getCurrentFrame().generateThumbnail(this.app.canvas);
  // }

  // Resets the viewport to the initial state
  render() {
    const ctx = this.app.ctx;
    ctx.save();

    // Always start with a background when exporting
    if (this.app.isExporting) {
      ctx.fillStyle = "#ffffff"; // white, or any background color you want
      ctx.fillRect(0, 0, this.app.canvas.width, this.app.canvas.height);
    } else {
      ctx.clearRect(0, 0, this.app.canvas.width, this.app.canvas.height);
    }

    ctx.scale(this.app.viewport.zoom, this.app.viewport.zoom);
    ctx.translate(this.app.viewport.x, this.app.viewport.y);

    // Onion skinning only when not exporting
    if (this.app.onionSkinEnabled && !this.app.isExporting) {
      if (this.app.currentFrameIndex > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        this.app.frames[this.app.currentFrameIndex - 1].draw(ctx);
        ctx.restore();
      }
      if (this.app.currentFrameIndex < this.app.frames.length - 1) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        this.app.frames[this.app.currentFrameIndex + 1].draw(ctx);
        ctx.restore();
      }
    }

    // Draw current frame
    this.app.getCurrentFrame().draw(ctx);

    if (this.app.currentShape) {
      this.app.currentShape.draw(ctx);
    }

    ctx.restore();

    // Selection handles only when not exporting
    if (
      !this.app.isExporting &&
      this.app.currentTool === "select" &&
      this.app.selectedShapes.length > 0
    ) {
      this.app.selectionTransformer.showSelectionHandles(ctx);
    }

    if (!this.app.isExporting) {
      this.app.getCurrentFrame().generateThumbnail(this.app.canvas);
    }
  }

  resetZoom() {
    this.app.viewport.zoom = 1;
    this.app.viewport.x = 0;
    this.app.viewport.y = 0;
    this.render();
  }

  // Exports the current frame as an image
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

      // Draw all shapes (disable onion skinning during export)
      this.app.isExporting = true;
      this.app.getCurrentFrame().draw(exportCtx);
      this.app.isExporting = false;

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

  async exportAnimation() {
    if (!this.app.canvas.captureStream || !window.MediaRecorder) {
      showMessageBox("Video export not supported in this browser.");
      return;
    }

    const fps = parseInt(document.getElementById("fpsInput").value) || 30;
    const stream = this.app.canvas.captureStream(fps);

    const recordedChunks = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm;codecs=vp8",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `animation_${Date.now()}.webm`;
      link.click();
      URL.revokeObjectURL(url);
    };

    mediaRecorder.start();

    let frameIndex = 0;
    const totalFrames = this.app.frames.length;
    const frameDuration = 1000 / fps;

    const ctx = this.app.ctx;
    const canvas = this.app.canvas;

    const renderNextFrame = () => {
      if (frameIndex >= totalFrames) {
        // wait a bit before stopping, to flush buffer
        setTimeout(() => mediaRecorder.stop(), 300);
        return;
      }

      // ✅ Always clear + paint a background (no transparency!)
      ctx.fillStyle = "#ffffff"; // or any bg color
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      this.app.isExporting = true;
      this.app.currentFrameIndex = frameIndex;
      this.render(); // ✅ must draw on *this.app.canvas*
      this.app.isExporting = false;

      frameIndex++;
      setTimeout(renderNextFrame, frameDuration);
    };

    renderNextFrame();
  }
}
