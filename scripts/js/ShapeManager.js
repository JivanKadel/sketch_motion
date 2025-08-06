import LineShape from "./shapes/LineShape.js";
import RectangleShape from "./shapes/RectangleShape.js";
import CircleShape from "./shapes/CircleShape.js";
import OvalShape from "./shapes/OvalShape.js";
import ArrowShape from "./shapes/ArrowShape.js";
import FreehandStroke from "./shapes/FreehandStroke.js";
import DiamondShape from "./shapes/DiamondShape.js";
import TextShape from "./shapes/TextShape.js";

export default class ShapeManager {
  constructor(app) {
    this.app = app;
  }

  setTool(tool) {
    this.app.currentTool = tool;
    document
      .querySelectorAll(".tool-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document.querySelector(`[data-tool="${tool}"]`)?.classList.add("active");
    if (this.app.currentTool !== "select") {
      this.app.selectedShapes = [];
      this.hideSelectionHandles();
      this.app.renderer.render();
    }
    if (tool === "image") {
      document.getElementById("imageInput")?.click();
    }
    if (tool == "select") {
      document.querySelector(".properties-panel")?.classList.remove("hidden");
    }
  }

  handleSelectMouseDown(mousePos) {
    const clickedShape = this.getShapeAtPoint(mousePos);
    document.querySelector(".properties-panel")?.classList.remove("hidden");
    if (!clickedShape) {
      this.app.selectedShapes = [];
      this.hideSelectionHandles();
    } else {
      if (!this.app.selectedShapes.includes(clickedShape)) {
        this.app.selectedShapes = [clickedShape];
      }
      this.showSelectionHandles();
    }
    this.app.renderer.render();
  }

  handleSelectMouseMove(mousePos) {
    if (this.app.selectedShapes.length > 0) {
      const dx = mousePos.x - this.app.lastMousePos.x;
      const dy = mousePos.y - this.app.lastMousePos.y;

      this.app.selectedShapes.forEach((shape) => {
        if (shape.transform) {
          shape.transform.x += dx;
          shape.transform.y += dy;
        }
      });

      this.app.renderer.render();
      this.updateTransformUI();
    }
  }

  startFreehandStroke(mousePos, isSmoothingChecked = false, epsilon = NaN) {
    this.app.currentShape = new FreehandStroke(epsilon, isSmoothingChecked);
    this.app.currentShape.strokeColor =
      document.getElementById("strokeColor").value;
    this.app.currentShape.strokeWidth = parseInt(
      document.getElementById("strokeWidth").value
    );
    this.app.currentShape.addPoint(mousePos);
  }

  startShapeDrawing(mousePos) {
    const strokeColor = document.getElementById("strokeColor").value;
    const strokeWidth = parseInt(document.getElementById("strokeWidth").value);
    const fillColor = document.getElementById("fillColor").value;
    const fillEnabled = document.getElementById("fillEnabled").checked;

    switch (this.app.currentTool) {
      case "line":
        this.app.currentShape = new LineShape(mousePos, mousePos);
        break;
      case "rectangle":
        this.app.currentShape = new RectangleShape(
          mousePos.x,
          mousePos.y,
          0,
          0
        );
        break;
      case "circle":
        this.app.currentShape = new CircleShape(mousePos.x, mousePos.y, 0);
        break;
      case "oval":
        this.app.currentShape = new OvalShape(mousePos.x, mousePos.y, 0, 0);
        break;
      case "arrow":
        this.app.currentShape = new ArrowShape(mousePos, mousePos);
        break;
      case "diamond":
        this.app.currentShape = new DiamondShape(mousePos.x, mousePos.y, 0, 0);
        break;
    }

    if (this.app.currentShape) {
      this.app.currentShape.strokeColor = strokeColor;
      this.app.currentShape.strokeWidth = strokeWidth;
      this.app.currentShape.fillColor = fillColor;
      this.app.currentShape.fillEnabled = fillEnabled;
    }
  }

  updateShapeDrawing(mousePos) {
    if (!this.app.currentShape) return;
    const dx = mousePos.x - this.app.dragStart.x;
    const dy = mousePos.y - this.app.dragStart.y;

    switch (this.app.currentTool) {
      case "line":
      case "arrow":
        this.app.currentShape.end = mousePos;
        break;
      case "rectangle":
        this.app.currentShape.width = Math.abs(dx);
        this.app.currentShape.height = Math.abs(dy);
        this.app.currentShape.x = dx < 0 ? mousePos.x : this.app.dragStart.x;
        this.app.currentShape.y = dy < 0 ? mousePos.y : this.app.dragStart.y;
        break;
      case "circle":
        this.app.currentShape.radius = Math.abs(dx);
        break;
      case "oval":
        this.app.currentShape.radiusX = Math.abs(dx);
        this.app.currentShape.radiusY = Math.abs(dy);
        break;
      case "diamond":
        this.app.currentShape.width = Math.abs(dx) * 2;
        this.app.currentShape.height = Math.abs(dy) * 2;
        break;
    }
  }

  handleErase(mousePos) {
    const shapesToRemove = [];

    this.app.getCurrentFrame().shapes.forEach((shape) => {
      const pivot =
        typeof shape.getCenter === "function"
          ? shape.getCenter()
          : { x: 0, y: 0 };
      const localPoint = shape.transform
        ? shape.transform.inverseTransformPoint(mousePos, pivot)
        : mousePos;

      if (shape.containsPoint(localPoint)) {
        shapesToRemove.push(shape);
      }
    });

    shapesToRemove.forEach((shape) => {
      this.app.getCurrentFrame().removeShape(shape);
    });

    if (shapesToRemove.length > 0) {
      this.app.renderer.render();
    }
  }

  addText(mousePos) {
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #222;
      color: #fff;
      padding: 24px 32px;
      border-radius: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      z-index: 1001;
      display: flex;
      flex-direction: column;
      gap: 18px;
      min-width: 300px;
      align-items: stretch;
    `;

    modal.innerHTML = `
      <label style="font-size: 1.1em; margin-bottom: 8px;">Enter text:</label>
      <input type="text" id="modalTextInput" style="
        padding: 8px;
        font-size: 1em;
        border-radius: 5px;
        border: 1px solid #555;
        margin-bottom: 10px;
        background: #333;
        color: #fff;
      " value="Text">
      <label style="font-size: 1.1em; margin-bottom: 8px;">Font size:</label>
      <input type="number" id="modalFontSizeInput" min="8" max="128" value="16" style="
        padding: 8px;
        font-size: 1em;
        border-radius: 5px;
        border: 1px solid #555;
        background: #333;
        color: #fff;
        margin-bottom: 10px;
      ">
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="modalTextOkBtn" style="
          padding: 8px 18px;
          background: #0078d4;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        ">OK</button>
        <button id="modalTextCancelBtn" style="
          padding: 8px 18px;
          background: #555;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        ">Cancel</button>
      </div>
    `;

    document.body.appendChild(modal);

    const textInput = modal.querySelector("#modalTextInput");
    textInput?.focus();

    modal.querySelector("#modalTextOkBtn")?.addEventListener("click", () => {
      const text = textInput.value;
      const fontSize =
        parseInt(modal.querySelector("#modalFontSizeInput").value) || 16;
      if (text) {
        const textShape = new TextShape(mousePos.x, mousePos.y, text, fontSize);
        textShape.strokeColor = document.getElementById("strokeColor").value;
        this.app.getCurrentFrame().addShape(textShape);
        this.app.renderer.render();
      }
      document.body.removeChild(modal);
    });

    modal
      .querySelector("#modalTextCancelBtn")
      ?.addEventListener("click", () => {
        document.body.removeChild(modal);
      });

    textInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        modal.querySelector("#modalTextOkBtn").click();
      }
    });
  }

  getShapeAtPoint(mousePos) {
    for (
      let i = this.app.frames[this.app.currentFrameIndex].shapes.length - 1;
      i >= 0;
      i--
    ) {
      const shape = this.app.frames[this.app.currentFrameIndex].shapes[i];
      const pivot = shape.getCenter?.() ?? { x: 0, y: 0 };
      const localPoint =
        shape.transform?.inverseTransformPoint(mousePos, pivot) ?? mousePos;

      if (shape.containsPoint(localPoint)) {
        return shape;
      }
    }
    return null;
  }

  deleteSelectedShapes() {
    this.app.selectedShapes.forEach((shape) => {
      this.app.getCurrentFrame().removeShape(shape);
    });
    this.app.selectedShapes = [];
    this.hideSelectionHandles();
    this.app.renderer.render();
  }

  copySelectedShapes() {
    this.app.clipboard = this.app.selectedShapes.map((shape) => shape.clone());
  }

  pasteShapes() {
    if (this.app.clipboard) {
      this.app.clipboard.forEach((shape) => {
        const cloned = shape.clone();
        cloned.transform.x += 20;
        cloned.transform.y += 20;
        this.app.getCurrentFrame().addShape(cloned);
      });
      this.app.renderer.render();
    }
  }

  updateSelectedShapes(property, value) {
    this.app.selectedShapes.forEach((shape) => {
      shape[property] = value;
    });
    this.app.renderer.render();
  }

  updateSelectedShapesTransform(property, value) {
    this.app.selectedShapes.forEach((shape) => {
      const transformProperty = property.replace("transform", "").toLowerCase();

      if (transformProperty === "x" || transformProperty === "y") {
        shape.transform[transformProperty] = value;
      } else if (
        transformProperty === "scaleX" ||
        transformProperty === "scaleY"
      ) {
        shape.transform[transformProperty] = value;
      } else if (transformProperty === "scale") {
        shape.transform.scale = value;
      } else if (transformProperty === "rotation") {
        shape.transform.rotation = value;
      } else if (
        transformProperty === "skewX" ||
        transformProperty === "skewY"
      ) {
        shape.transform[transformProperty] = value;
      }
    });

    this.app.renderer.render();
  }

  showSelectionHandles() {
    if (this.app.selectedShapes.length !== 1) return;

    const shape = this.app.selectedShapes[0];
    const bounds = shape.getBounds();
    const handleSize = 10;
    const ctx = this.app.ctx;

    const pivot = shape.getCenter?.() ?? { x: 0, y: 0 };
    const transform = shape.transform;

    const topLeft = transform.transformPoint(
      { x: bounds.x, y: bounds.y },
      pivot
    );
    const topRight = transform.transformPoint(
      { x: bounds.x + bounds.width, y: bounds.y },
      pivot
    );
    const bottomLeft = transform.transformPoint(
      { x: bounds.x, y: bounds.y + bounds.height },
      pivot
    );
    const bottomRight = transform.transformPoint(
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      pivot
    );

    const rotationHandle = transform.transformPoint(
      { x: bounds.x + bounds.width / 2, y: bounds.y - 30 },
      pivot
    );

    ctx.save();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#0078d4";
    ctx.fillStyle = "#fff";
    ctx.lineWidth = 2;

    const handles = [topLeft, topRight, bottomLeft, bottomRight];
    handles.forEach((h) => {
      ctx.beginPath();
      ctx.rect(
        h.x - handleSize / 2,
        h.y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.fill();
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.arc(rotationHandle.x, rotationHandle.y, handleSize / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo((topLeft.x + topRight.x) / 2, (topLeft.y + topRight.y) / 2);
    ctx.lineTo(rotationHandle.x, rotationHandle.y);
    ctx.stroke();

    ctx.restore();

    this.updateTransformUI();
  }

  isInsideHandle(point, handle, size = 10) {
    return (
      point.x >= handle.x - size / 2 &&
      point.x <= handle.x + size / 2 &&
      point.y >= handle.y - size / 2 &&
      point.y <= handle.y + size / 2
    );
  }

  hideSelectionHandles() {
    const selectionHandles = document.getElementById("selectionHandles");
    if (selectionHandles) {
      selectionHandles.innerHTML = "";
    }
  }

  updateTransformUI() {
    if (this.app.selectedShapes.length === 1) {
      const shape = this.app.selectedShapes[0];
      document.getElementById("transformX").value =
        shape.transform.x.toString();
      document.getElementById("transformY").value =
        shape.transform.y.toString();
      document.getElementById("scaleX").value =
        shape.transform.scaleX.toString();
      document.getElementById("scaleY").value =
        shape.transform.scaleY.toString();
      document.getElementById("rotation").value =
        shape.transform.rotation.toString();
    } else {
      document.getElementById("transformX").value = "0";
      document.getElementById("transformY").value = "0";
      document.getElementById("scaleX").value = "1";
      document.getElementById("scaleY").value = "1";
      document.getElementById("rotation").value = "0";
    }
  }
}
