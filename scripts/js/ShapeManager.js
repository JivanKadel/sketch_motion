import LineShape from "./shapes/LineShape.js";
import RectangleShape from "./shapes/RectangleShape.js";
import CircleShape from "./shapes/CircleShape.js";
import OvalShape from "./shapes/OvalShape.js";
import ArrowShape from "./shapes/ArrowShape.js";
import FreehandStroke from "./shapes/FreehandStroke.js";
import DiamondShape from "./shapes/DiamondShape.js";
import TextShape from "./shapes/TextShape.js";

// Handles shape creation and management
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

    // Always clear selection when changing tools
    this.app.selectedShapes = [];
    this.app.selectionTransformer.hideSelectionHandles();
    this.app.renderer.render();

    if (tool === "image") {
      document.getElementById("imageInput")?.click();
    }

    // Handle properties panel visibility
    const propertiesPanel = document.querySelector(".properties-panel");
    if (tool === "select" && this.app.propertiesPanelManuallyHidden) {
      // Show panel in select mode if it was manually hidden
      propertiesPanel?.classList.remove("hidden");
      this.app.propertiesPanelManuallyHidden = false; // Reset the flag
    }
    // Keep the panel visible by default
  }

  handleSelectMouseDown(mousePos) {
    const clickedShape = this.getShapeAtPoint(mousePos);
    if (clickedShape) {
      // Always select the clicked shape, even if another is selected
      this.app.selectedShapes = [clickedShape];
      this.app.selectionTransformer.showSelectionHandles();
    } else {
      // Deselect all if clicked empty space
      this.app.selectedShapes = [];
      this.app.selectionTransformer.hideSelectionHandles();
    }
    this.app.renderer.render();
  }

  handleSelectMouseMove(mousePos) {
    if (this.app.selectedShapes.length > 0) {
      const dx = mousePos.x - this.app.lastMousePos.x;
      const dy = mousePos.y - this.app.lastMousePos.y;

      this.app.selectedShapes.forEach((shape) => {
        // Move the shape's actual coordinates instead of using transform offset
        if (shape.x !== undefined && shape.y !== undefined) {
          shape.x += dx;
          shape.y += dy;
        } else if (shape.centerX !== undefined && shape.centerY !== undefined) {
          shape.centerX += dx;
          shape.centerY += dy;
        } else if (shape.start && shape.end) {
          shape.start.x += dx;
          shape.start.y += dy;
          shape.end.x += dx;
          shape.end.y += dy;
        } else if (shape.points && Array.isArray(shape.points)) {
          // Move all points for freehand strokes
          shape.points = shape.points.map((pt) => ({
            x: pt.x + dx,
            y: pt.y + dy,
          }));
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
      const bounds = shape.getBounds();
      const localPoint = shape.transform
        ? shape.transform.inverseTransformPoint(mousePos, bounds)
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
      const bounds = shape.getBounds();
      const localPoint =
        shape.transform?.inverseTransformPoint(mousePos, bounds) ?? mousePos;

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
    this.app.selectionTransformer.hideSelectionHandles();
    this.app.renderer.render();
  }

  copySelectedShapes() {
    this.app.clipboard = this.app.selectedShapes.map((shape) => shape.clone());
  }

  pasteShapes() {
    if (this.app.clipboard) {
      this.app.clipboard.forEach((shape) => {
        const cloned = shape.clone();

        // Move the cloned shape's actual coordinates
        if (cloned.x !== undefined && cloned.y !== undefined) {
          cloned.x += 20;
          cloned.y += 20;
        } else if (
          cloned.centerX !== undefined &&
          cloned.centerY !== undefined
        ) {
          cloned.centerX += 20;
          cloned.centerY += 20;
        } else if (cloned.start && cloned.end) {
          cloned.start.x += 20;
          cloned.start.y += 20;
          cloned.end.x += 20;
          cloned.end.y += 20;
        }

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

      if (transformProperty === "x") {
        // Update the shape's actual x coordinate
        if (shape.x !== undefined) {
          shape.x = value;
        } else if (shape.centerX !== undefined) {
          shape.centerX = value;
        } else if (shape.start) {
          const dx = value - shape.start.x;
          shape.start.x = value;
          shape.end.x += dx;
        }
      } else if (transformProperty === "y") {
        // Update the shape's actual y coordinate
        if (shape.y !== undefined) {
          shape.y = value;
        } else if (shape.centerY !== undefined) {
          shape.centerY = value;
        } else if (shape.start) {
          const dy = value - shape.start.y;
          shape.start.y = value;
          shape.end.y += dy;
        }
      } else if (transformProperty === "scale") {
        shape.transform.scale = value;
      } else if (transformProperty === "rotation") {
        shape.transform.rotation = value;
      }
    });

    this.app.renderer.render();
  }

  updateTransformUI() {
    if (this.app.selectedShapes.length === 1) {
      const shape = this.app.selectedShapes[0];

      // Show the shape's actual position
      let shapeX = 0,
        shapeY = 0;
      if (shape.x !== undefined && shape.y !== undefined) {
        shapeX = shape.x;
        shapeY = shape.y;
      } else if (shape.centerX !== undefined && shape.centerY !== undefined) {
        shapeX = shape.centerX;
        shapeY = shape.centerY;
      } else if (shape.start) {
        shapeX = shape.start.x;
        shapeY = shape.start.y;
      }

      document.getElementById("transformX").value = shapeX.toString();
      document.getElementById("transformY").value = shapeY.toString();
      document.getElementById("scale").value = shape.transform.scale.toString();
      document.getElementById("rotation").value =
        shape.transform.rotation.toString();
    } else {
      document.getElementById("transformX").value = "0";
      document.getElementById("transformY").value = "0";
      document.getElementById("scale").value = "1";
      document.getElementById("rotation").value = "0";
    }
  }
}
