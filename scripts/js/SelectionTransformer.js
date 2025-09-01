// Handles shape selection and transformation
class SelectionTransformer {
  constructor(app) {
    this.app = app;
    this.dragMode = null; // 'move' | 'rotate' | 'scale'
    this.activeHandle = null;
    this.startMousePos = null; // world coords {x,y}
    this.startTransform = null; // snapshot of transform numbers
    this.pivot = null; // world coords pivot {x,y}
    this.handleSize = 10;
  }

  // Converts degrees to radians
  rad(deg) {
    return (deg * Math.PI) / 180;
  }

  // Rotates a point around the origin
  rotatePoint(x, y, rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return {
      x: x * c - y * s,
      y: x * s + y * c,
    };
  }

  // Converts local point to world coordinates
  localToWorld(localPoint, transform, pivotWorld) {
    const sx = localPoint.x * transform.scaleX;
    const sy = localPoint.y * transform.scaleY;
    const rotated = this.rotatePoint(sx, sy, this.rad(transform.rotation));
    return {
      x: rotated.x + pivotWorld.x,
      y: rotated.y + pivotWorld.y,
    };
  }

  // Converts world coordinates to local point
  worldToLocal(worldPoint, transform, pivotWorld) {
    let x = worldPoint.x - pivotWorld.x;
    let y = worldPoint.y - pivotWorld.y;
    const inv = this.rotatePoint(x, y, -this.rad(transform.rotation));
    return {
      x: inv.x / (transform.scaleX || 1),
      y: inv.y / (transform.scaleY || 1),
    };
  }

  // Computes the pivot point for rotation and scaling
  computePivot(bounds) {
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
  }

  // Hides the selection handles
  hideSelectionHandles() {
    const selectionHandles = document.getElementById("selectionHandles");
    if (selectionHandles) {
      selectionHandles.innerHTML = "";
    }
  }

  // Shows the selection handles
  showSelectionHandles() {
    if (this.app.selectedShapes.length !== 1) {
      this.hideSelectionHandles();
      return;
    }
    const shape = this.app.selectedShapes[0];
    if (!shape) {
      this.hideSelectionHandles();
      return;
    }

    // Get the canvas context and shape bounds
    const ctx = this.app.ctx;
    const bounds = shape.getBounds();
    const pivotWorld = this.computePivot(bounds);
    const t = shape.transform;

    // Get the local corners of the shape
    const cornersLocal = [
      { x: bounds.x - pivotWorld.x, y: bounds.y - pivotWorld.y }, // top-left
      { x: bounds.x + bounds.width - pivotWorld.x, y: bounds.y - pivotWorld.y }, // top-right
      {
        x: bounds.x - pivotWorld.x,
        y: bounds.y + bounds.height - pivotWorld.y,
      }, // bottom-left
      {
        x: bounds.x + bounds.width - pivotWorld.x,
        y: bounds.y + bounds.height - pivotWorld.y,
      }, // bottom-right
    ];

    // Transform local corners to world coordinates
    const transformedCorners = cornersLocal.map((lp) =>
      this.localToWorld(lp, t, pivotWorld)
    );

    const topCenterLocal = {
      x: bounds.x + bounds.width / 2 - pivotWorld.x,
      y: bounds.y - pivotWorld.y,
    };
    const rotationHandleLocal = {
      x: topCenterLocal.x,
      y: topCenterLocal.y - 30,
    };
    const rotationHandleWorld = this.localToWorld(
      rotationHandleLocal,
      t,
      pivotWorld
    );
    const topCenterWorld = this.localToWorld(topCenterLocal, t, pivotWorld);

    ctx.save();
    ctx.strokeStyle = "#0078d4";
    ctx.fillStyle = "#fff";
    ctx.lineWidth = 2 / this.app.viewport.zoom; // Scale line width with zoom

    const size = this.handleSize / this.app.viewport.zoom; // Scale handle size with zoom
    transformedCorners.forEach((h) => {
      ctx.beginPath();
      ctx.rect(h.x - size / 2, h.y - size / 2, size, size);
      ctx.fill();
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.arc(
      rotationHandleWorld.x,
      rotationHandleWorld.y,
      size / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(topCenterWorld.x, topCenterWorld.y);
    ctx.lineTo(rotationHandleWorld.x, rotationHandleWorld.y);
    ctx.stroke();

    ctx.restore();
  }

  handleMouseDown(mousePos) {
    if (this.app.selectedShapes.length !== 1) return;

    const shape = this.app.selectedShapes[0];
    if (!shape) return;

    const bounds = shape.getBounds();
    const pivotWorld = this.computePivot(bounds);
    const t = shape.transform;

    const topRightLocal = {
      x: bounds.x + bounds.width - pivotWorld.x,
      y: bounds.y - pivotWorld.y,
    };
    const bottomRightLocal = {
      x: bounds.x + bounds.width - pivotWorld.x,
      y: bounds.y + bounds.height - pivotWorld.y,
    };
    const rotationHandleLocal = {
      x: bounds.x + bounds.width / 2 - pivotWorld.x,
      y: bounds.y - pivotWorld.y - 30,
    };

    const topRightWorld = this.localToWorld(topRightLocal, t, pivotWorld);
    const bottomRightLocalWorld = this.localToWorld(
      bottomRightLocal,
      t,
      pivotWorld
    );
    const rotationHandleWorld = this.localToWorld(
      rotationHandleLocal,
      t,
      pivotWorld
    );

    // Prioritize rotation, then scale, then move
    if (this.isInsideHandle(mousePos, rotationHandleWorld)) {
      this.dragMode = "rotate";
      this.activeHandle = rotationHandleWorld;
    } else if (
      this.isInsideHandle(mousePos, topRightWorld) ||
      this.isInsideHandle(mousePos, bottomRightLocalWorld)
    ) {
      this.dragMode = "scale";
      this.activeHandle = this.isInsideHandle(mousePos, topRightWorld)
        ? topRightWorld
        : bottomRightLocalWorld;
    } else {
      // Check if click is inside the shape bounds
      let testPoint = mousePos;

      // Only apply coordinate transformation if shape has meaningful transforms
      if (t && (t.rotation !== 0 || t.scaleX !== 1 || t.scaleY !== 1)) {
        testPoint = this.worldToLocal(mousePos, t, pivotWorld);
      }

      if (shape.containsPoint && shape.containsPoint(testPoint)) {
        this.dragMode = "move";
        this.activeHandle = null;
      } else {
        // Click is outside shape - let ShapeManager handle selection
        this.app.shapeManager.handleSelectMouseDown(mousePos);
        return;
      }
    }

    // Snapshot of initial state
    this.startTransform = {
      rotation: t.rotation || 0,
      scaleX: t.scaleX == null ? 1 : t.scaleX,
      scaleY: t.scaleY == null ? 1 : t.scaleY,
    };

    this.startMousePos = { x: mousePos.x, y: mousePos.y };
    this.pivot = pivotWorld;
  }

  handleMouseMove(mousePos) {
    if (!this.app || !this.dragMode || this.app.selectedShapes.length !== 1)
      return;

    const shape = this.app.selectedShapes[0];
    if (!shape) return;

    const t = shape.transform;

    if (this.dragMode === "move") {
      const dx = mousePos.x - this.startMousePos.x;
      const dy = mousePos.y - this.startMousePos.y;

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
        // Move all points for freehand strokes - use same delta as other shapes
        shape.points = shape.points.map((pt) => ({
          x: pt.x + dx,
          y: pt.y + dy,
        }));
        // Also update smoothed points for freehand strokes
        if (shape.smoothedPoints && Array.isArray(shape.smoothedPoints)) {
          shape.smoothedPoints = shape.smoothedPoints.map((pt) => ({
            x: pt.x + dx,
            y: pt.y + dy,
          }));
        }
      }

      // Update mouse position for next iteration
      this.startMousePos = { x: mousePos.x, y: mousePos.y };
    } else if (this.dragMode === "rotate") {
      // Keep the original pivot from when we started the operation
      const pivot = this.pivot;
      const a1 = Math.atan2(
        this.startMousePos.y - pivot.y,
        this.startMousePos.x - pivot.x
      );
      const a2 = Math.atan2(mousePos.y - pivot.y, mousePos.x - pivot.x);
      const deltaDeg = ((a2 - a1) * 180) / Math.PI;
      t.rotation = this.startTransform.rotation + deltaDeg;
    } else if (this.dragMode === "scale") {
      // Keep the original pivot from when we started the operation
      const pivot = this.pivot;
      const startDist =
        Math.hypot(
          this.startMousePos.x - pivot.x,
          this.startMousePos.y - pivot.y
        ) || 1;
      const nowDist = Math.hypot(mousePos.x - pivot.x, mousePos.y - pivot.y);
      const ratio = nowDist / startDist;
      t.scaleX = this.startTransform.scaleX * ratio;
      t.scaleY = this.startTransform.scaleY * ratio;
    }

    // Trigger render and UI update
    if (this.app.renderer && typeof this.app.renderer.render === "function") {
      this.app.renderer.render();
    } else if (typeof this.app.render === "function") {
      this.app.render();
    }

    if (
      this.app.shapeManager &&
      typeof this.app.shapeManager.updateTransformUI === "function"
    ) {
      this.app.shapeManager.updateTransformUI();
    }
  }

  handleMouseUp() {
    this.dragMode = null;
    this.activeHandle = null;
    this.startMousePos = null;
    this.startTransform = null;
    this.pivot = null;
  }

  // Checks if a point is inside a handle
  isInsideHandle(p, handle, size = this.handleSize / this.app.viewport.zoom) {
    return (
      p.x >= handle.x - size / 2 &&
      p.x <= handle.x + size / 2 &&
      p.y >= handle.y - size / 2 &&
      p.y <= handle.y + size / 2
    );
  }
}

export default SelectionTransformer;
