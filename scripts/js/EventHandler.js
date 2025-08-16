import Point from "./core/Point.js";
import FreehandStroke from "./shapes/FreehandStroke.js";
import ImageShape from "./shapes/ImageShape.js";
import { showMessageBox } from "./helpers/messagebox.js";

export default class EventHandler {
  constructor(app) {
    this.app = app;
  }

  setupEventListeners() {
    this.app.canvas.addEventListener("mousedown", (e) => {
      const pos = this.getMousePos(e);
      this.handleMouseDown(e, pos);
    });

    this.app.canvas.addEventListener("mousemove", (e) => {
      const pos = this.getMousePos(e);
      this.handleMouseMove(e, pos);
    });

    this.app.canvas.addEventListener("mouseup", (e) => {
      this.handleMouseUp(e);
    });

    this.app.canvas.addEventListener("dragstart", (e) => {
      e.preventDefault();
    });

    this.app.canvas.addEventListener("wheel", this.handleWheel.bind(this));

    document.querySelectorAll(".tool-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tool = e.target.closest(".tool-btn")?.dataset.tool;
        if (tool) {
          this.app.setTool(tool);
        }
      });
    });

    document
      .getElementById("imageInput")
      ?.addEventListener("change", this.handleImageUpload.bind(this));

    this.setupPropertyControls();

    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  setupPropertyControls() {
    const strokeColor = document.getElementById("strokeColor");
    const strokeColorPreview = document.getElementById("strokeColorPreview");
    const strokeWidth = document.getElementById("strokeWidth");
    const strokeWidthValue = document.getElementById("strokeWidthValue");
    const fillColor = document.getElementById("fillColor");
    const fillColorPreview = document.getElementById("fillColorPreview");
    const fillEnabled = document.getElementById("fillEnabled");
    const fpsInput = document.getElementById("fpsInput");

    strokeColor.addEventListener("change", (e) => {
      strokeColorPreview.style.background = e.target.value;
      this.app.shapeManager.updateSelectedShapes("strokeColor", e.target.value);
    });

    strokeWidth.addEventListener("input", (e) => {
      strokeWidthValue.textContent = e.target.value;
      this.app.shapeManager.updateSelectedShapes(
        "strokeWidth",
        parseInt(e.target.value)
      );
    });

    fillColor.addEventListener("change", (e) => {
      fillColorPreview.style.background = e.target.value;
      this.app.shapeManager.updateSelectedShapes("fillColor", e.target.value);
    });

    fillEnabled.addEventListener("change", (e) => {
      this.app.shapeManager.updateSelectedShapes(
        "fillEnabled",
        e.target.checked
      );
    });

    fpsInput.addEventListener("change", (e) => {
      this.app.fps = parseInt(e.target.value);
      if (this.app.animationPlaying) {
        this.app.animationManager.stopAnimation();
        this.app.animationManager.startAnimation();
      }
    });

    ["transformX", "transformY", "scale", "rotation"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", (e) => {
        this.app.shapeManager.updateSelectedShapesTransform(
          id,
          parseFloat(e.target.value)
        );
      });
    });
  }

  getMousePos(e) {
    const rect = this.app.canvas.getBoundingClientRect();
    return new Point(
      (e.clientX - rect.left) / this.app.viewport.zoom - this.app.viewport.x,
      (e.clientY - rect.top) / this.app.viewport.zoom - this.app.viewport.y
    );
  }

  handleMouseDown(e, pos) {
    this.app.lastMousePos = pos;
    this.app.isDragging = true;
    this.app.dragStart = pos;

    if (this.app.currentTool === "select") {
      // Try transformer first (handles take priority)
      this.app.selectionTransformer.handleMouseDown(pos);
      if (!this.app.selectionTransformer.dragMode) {
        // If no handle was clicked, attempt to select a shape
        this.app.shapeManager.handleSelectMouseDown(pos);
      }
    } else if (this.app.currentTool === "pen") {
      let epsilon = 0;
      const smoothingEnabled = document.getElementById("smoothingEnabled");
      const isSmoothingChecked = smoothingEnabled?.checked;

      if (smoothingEnabled?.checked) {
        epsilon = parseFloat(
          document.getElementById("smoothingEpsilonValue")?.textContent || "0"
        );
      }
      this.app.shapeManager.startFreehandStroke(
        pos,
        isSmoothingChecked,
        epsilon
      );
    } else if (this.app.currentTool === "eraser") {
      this.app.shapeManager.handleErase(pos);
    } else if (this.app.currentTool === "text") {
      this.app.shapeManager.addText(pos);
    } else {
      this.app.shapeManager.startShapeDrawing(pos);
    }
  }

  handleMouseMove(e, pos) {
    if (!this.app.isDragging) return;
    if (this.app.currentTool === "select") {
      // Only handle transformer if a drag is active
      if (this.app.selectionTransformer.dragMode) {
        this.app.selectionTransformer.handleMouseMove(pos);
      } else {
        this.app.shapeManager.handleSelectMouseMove(pos);
      }
    } else if (
      this.app.currentTool === "pen" &&
      this.app.currentShape instanceof FreehandStroke
    ) {
      this.app.currentShape.addPoint(pos);
      this.app.renderer.render();
    } else if (this.app.currentTool === "eraser") {
      this.app.shapeManager.handleErase(pos);
    } else if (this.app.currentShape) {
      this.app.shapeManager.updateShapeDrawing(pos);
      this.app.renderer.render();
    }
    this.app.lastMousePos = pos;
  }

  handleMouseUp(e) {
    this.app.isDragging = false;
    if (this.app.currentTool === "select") {
      this.app.selectionTransformer.handleMouseUp();
    }
    if (this.app.currentShape && this.app.currentTool !== "select") {
      this.app.getCurrentFrame().addShape(this.app.currentShape);
      this.app.currentShape = null;
      this.app.renderer.render();
    }
  }

  handleWheel(e) {
    e.preventDefault();
    const mousePos = this.getMousePos(e);
    const zoomFactor = e.deltaY > 0 ? 0.99 : 1.01;
    this.app.viewport.zoom *= zoomFactor;
    this.app.viewport.zoom = Math.max(0.1, Math.min(5, this.app.viewport.zoom));
    this.app.viewport.x =
      mousePos.x - (mousePos.x - this.app.viewport.x) * zoomFactor;
    this.app.viewport.y =
      mousePos.y - (mousePos.y - this.app.viewport.y) * zoomFactor;
    this.app.renderer.render();
  }

  handleKeyDown(e) {
    if (e.key === "Delete") {
      this.app.shapeManager.deleteSelectedShapes();
    } else if (e.ctrlKey && e.key === "z") {
      e.preventDefault();
    } else if (e.ctrlKey && e.key === "c") {
      this.app.shapeManager.copySelectedShapes();
      e.preventDefault();
    } else if (e.ctrlKey && e.key === "v") {
      this.app.shapeManager.pasteShapes();
      e.preventDefault();
    }
  }

  handleImageUpload(e) {
    const fileInput = e.target;
    const file = fileInput.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result;
        if (!imageData) return;
        const img = new window.Image();
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          const fixedWidth = 200;
          const proportionalHeight = fixedWidth / aspectRatio;
          const imageShape = new ImageShape(
            100,
            100,
            fixedWidth,
            proportionalHeight,
            imageData
          );
          this.app.getCurrentFrame().addShape(imageShape);
          setTimeout(() => {
            this.app.animationManager.updateFramesPanel();
          }, 100);
          fileInput.value = "";
          this.app.renderer.render();
        };
        img.src = imageData;
        return;
      };
      reader.readAsDataURL(file);
    }
  }
}
