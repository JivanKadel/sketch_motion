export default class UISetup {
  constructor(app) {
    this.app = app;
  }

  setupUI() {
    this.centerCanvas();
    window.addEventListener("resize", () => this.centerCanvas());
  }

  centerCanvas() {
    const container = document.getElementById("canvasWrapper");
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const canvasRect = this.app.canvas.getBoundingClientRect();
    this.app.canvas.style.left = `${
      (containerRect.width - canvasRect.width) / 2
    }px`;
    this.app.canvas.style.top = `${
      (containerRect.height - canvasRect.height) / 2
    }px`;
  }
}
