import Frame from "./Frame.js";

export default class AnimationManager {
  constructor(app) {
    this.app = app;
  }

  static Frame = Frame;

  getCurrentFrame() {
    return this.app.frames[this.app.currentFrameIndex];
  }

  addFrame() {
    const newFrame = new Frame();
    this.app.frames.push(newFrame);
    this.app.currentFrameIndex = this.app.frames.length - 1;
    this.updateFramesPanel();
    this.app.renderer.render();
  }

  selectFrame(index) {
    if (index >= 0 && index < this.app.frames.length) {
      this.app.currentFrameIndex = index;
      this.app.selectedShapes = [];
      this.app.selectionTransformer.hideSelectionHandles();
      this.updateFramesPanel();
      this.app.renderer.render();
    }
  }

  updateFramesPanel() {
    const framesList = document.getElementById("framesList");
    if (!framesList) return;
    framesList.innerHTML = "";
    this.app.frames.forEach((frame, index) => {
      const frameEl = document.createElement("div");
      frameEl.className = "frame-thumbnail";
      if (index === this.app.currentFrameIndex) {
        frameEl.classList.add("active");
      }
      if (frame.thumbnail) {
        frameEl.style.backgroundImage = `url(${frame.thumbnail})`;
        frameEl.style.backgroundSize = "cover";
        frameEl.style.backgroundPosition = "center";
      }
      const frameNumber = document.createElement("div");
      frameNumber.className = "frame-number";
      frameNumber.textContent = (index + 1).toString();
      frameEl.appendChild(frameNumber);
      frameEl.addEventListener("click", () => this.selectFrame(index));
      framesList.appendChild(frameEl);
    });
  }

  toggleAnimation() {
    const playBtn = document.getElementById("playBtn");
    if (!playBtn) return;
    if (this.app.animationPlaying) {
      this.stopAnimation();
      playBtn.textContent = "▶️";
    } else {
      this.startAnimation();
      playBtn.textContent = "⏸️";
    }
  }

  startAnimation() {
    this.app.animationPlaying = true;
    this.app.fps = parseInt(document.getElementById("fpsInput").value);
    this.app.lastAnimationTime = performance.now();
    this.animateFrame();
  }

  stopAnimation() {
    this.app.animationPlaying = false;
    if (this.app.animationFrame) {
      cancelAnimationFrame(this.app.animationFrame);
    }
  }

  animateFrame() {
    if (!this.app.animationPlaying) return;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.app.lastAnimationTime;
    const frameTime = 1000 / this.app.fps;
    if (deltaTime >= frameTime) {
      this.app.currentFrameIndex =
        (this.app.currentFrameIndex + 1) % this.app.frames.length;
      this.app.renderer.render();
      this.updateFramesPanel();
      this.app.lastAnimationTime = currentTime - (deltaTime % frameTime);
    }
    this.app.animationFrame = requestAnimationFrame(() => this.animateFrame());
  }
}
