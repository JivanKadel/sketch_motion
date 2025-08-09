// Selection logic and interaction
class SelectionTransformer {
  constructor(app) {
    this.app = app; // reference to main app instance
    this.dragMode = null;
    this.activeHandle = null;
    this.startMousePos = null;
    this.startTransform = null;
    this.pivot = null;
    this.handlesVisible = false;
  }

  hideSelectionHandles() {
    const selectionHandles = document.getElementById("selectionHandles");
    if (selectionHandles) {
      selectionHandles.innerHTML = "";
    }
  }

  showSelectionHandles(ctx) {
    if (this.app.selectedShapes.length !== 1) return;

    const shape = this.app.selectedShapes[0];
    const bounds = shape.getBounds();
    const pivot = shape.getCenter?.() ?? {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };

    const corners = [
      { x: bounds.x, y: bounds.y }, // top-left
      { x: bounds.x + bounds.width, y: bounds.y }, // top-right
      { x: bounds.x, y: bounds.y + bounds.height }, // bottom-left
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // bottom-right
    ];

    const transformedCorners = corners.map((pt) =>
      shape.transform.transformPoint(pt, pivot)
    );

    const rotationHandle = shape.transform.transformPoint(
      { x: bounds.x + bounds.width / 2, y: bounds.y - 30 },
      pivot
    );

    this.app.ctx.save();
    this.app.ctx.strokeStyle = "#0078d4";
    this.app.ctx.fillStyle = "#fff";
    this.app.ctx.lineWidth = 2;

    // Draw handles at transformed corners
    const size = 10;
    transformedCorners.forEach((h) => {
      this.app.ctx.beginPath();
      this.app.ctx.rect(h.x - size / 2, h.y - size / 2, size, size);
      this.app.ctx.fill();
      this.app.ctx.stroke();
    });

    // Draw rotation handle
    this.app.ctx.beginPath();
    this.app.ctx.arc(
      rotationHandle.x,
      rotationHandle.y,
      size / 2,
      0,
      2 * Math.PI
    );
    this.app.ctx.fill();
    this.app.ctx.stroke();

    // Draw line from top-center to rotation handle
    const topCenter = shape.transform.transformPoint(
      { x: bounds.x + bounds.width / 2, y: bounds.y },
      pivot
    );
    this.app.ctx.beginPath();
    this.app.ctx.moveTo(topCenter.x, topCenter.y);
    this.app.ctx.lineTo(rotationHandle.x, rotationHandle.y);
    this.app.ctx.stroke();

    this.app.ctx.restore();
  }

  handleMouseDown(mousePos) {
    const shape = this.app.selectedShapes[0];
    // console.log("SelectionTransformer handleMouseDown", shape);

    if (!shape) return;
    const bounds = shape.getBounds();
    const pivot = shape.getCenter?.() ?? { x: 0, y: 0 };
    const transform = shape.transform;

    const topRight = transform.transformPoint(
      { x: bounds.x + bounds.width, y: bounds.y },
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

    if (this._isInsideHandle(mousePos, rotationHandle)) {
      this.dragMode = "rotate";
    } else if (this._isInsideHandle(mousePos, topRight)) {
      this.dragMode = "scale";
    } else {
      this.dragMode = "move";
    }

    this.activeHandle = topRight;
    this.startMousePos = mousePos;
    this.startTransform = { ...shape.transform };
    this.pivot = pivot;
  }

  handleMouseMove(mousePos) {
    const shape = this.app.selectedShapes[0];
    if (!shape || !this.dragMode) return;
    const dx = mousePos.x - this.startMousePos.x;
    const dy = mousePos.y - this.startMousePos.y;

    const pivot = this.pivot;
    const transform = shape.transform;

    if (this.dragMode === "move") {
      transform.x = this.startTransform.x + dx;
      transform.y = this.startTransform.y + dy;
    } else if (this.dragMode === "rotate") {
      const angle1 = Math.atan2(
        this.startMousePos.y - pivot.y,
        this.startMousePos.x - pivot.x
      );
      const angle2 = Math.atan2(mousePos.y - pivot.y, mousePos.x - pivot.x);
      transform.rotation =
        this.startTransform.rotation + ((angle2 - angle1) * 180) / Math.PI;
    } else if (this.dragMode === "scale") {
      const distStart = Math.hypot(
        this.startMousePos.x - pivot.x,
        this.startMousePos.y - pivot.y
      );
      const distNow = Math.hypot(mousePos.x - pivot.x, mousePos.y - pivot.y);
      const scaleRatio = distNow / distStart;
      transform.scaleX = this.startTransform.scale * scaleRatio;
      transform.scaleY = this.startTransform.scale * scaleRatio;
    }

    // this.app.render();
    this.app.renderer.render();
    // this.app.updateTransformUI();
    this.app.shapeManager.updateTransformUI();
  }

  handleMouseUp() {
    this.dragMode = null;
    this.activeHandle = null;
  }

  _isInsideHandle(p, handle, size = 10) {
    return (
      p.x >= handle.x - size / 2 &&
      p.x <= handle.x + size / 2 &&
      p.y >= handle.y - size / 2 &&
      p.y <= handle.y + size / 2
    );
  }
}

export default SelectionTransformer;
