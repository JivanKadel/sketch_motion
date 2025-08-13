// SelectionTransformer.js
class SelectionTransformer {
  constructor(app) {
    this.app = app; // main app
    this.dragMode = null; // 'move' | 'rotate' | 'scale'
    this.activeHandle = null;
    this.startMousePos = null; // world coords {x,y}
    this.startTransform = null; // snapshot of transform numbers
    this.pivot = null; // world coords pivot {x,y}
    this.handleSize = 10;
  }

  // ---- Math helpers (no dependency on shape.transform methods) ----
  // Convert degrees -> radians
  _rad(deg) {
    return (deg * Math.PI) / 180;
  }

  // Rotate a point (x,y) by angle rad
  _rotatePoint(x, y, rad) {
    const c = Math.cos(rad);
    const s = Math.sin(rad);
    return {
      x: x * c - y * s,
      y: x * s + y * c,
    };
  }

  // Convert a point from local (object) space (where pivot is origin) => world space
  // localPoint: {x,y} measured with pivot at origin
  // transform: {x,y, scaleX, scaleY, rotation}
  // pivotWorld: {x,y} world coords of pivot
  localToWorld(localPoint, transform, pivotWorld) {
    // scale
    const sx = localPoint.x * transform.scaleX;
    const sy = localPoint.y * transform.scaleY;

    // rotate
    const rotated = this._rotatePoint(sx, sy, this._rad(transform.rotation));

    // translate: pivotWorld + transform position (transform.x/y is object translation in world coords)
    // Note: transform.x/transform.y is the object's world offset. We assume pivotWorld is computed in world coords (object bounds center),
    // so the final world point = pivotWorld + rotated + (transform.x, transform.y)
    return {
      x: rotated.x + pivotWorld.x + transform.x,
      y: rotated.y + pivotWorld.y + transform.y,
    };
  }

  // Convert a world point => local (object) space (pivot at origin)
  worldToLocal(worldPoint, transform, pivotWorld) {
    // move to object-local origin: subtract transform position and pivot world
    let x = worldPoint.x - transform.x - pivotWorld.x;
    let y = worldPoint.y - transform.y - pivotWorld.y;

    // inverse rotate
    const inv = this._rotatePoint(x, y, -this._rad(transform.rotation));

    // inverse scale
    return {
      x: inv.x / (transform.scaleX || 1),
      y: inv.y / (transform.scaleY || 1),
    };
  }

  // Compute the world-space pivot (center of bounds)
  _computePivot(bounds) {
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
  }

  hideSelectionHandles() {
    const selectionHandles = document.getElementById("selectionHandles");
    if (selectionHandles) {
      selectionHandles.innerHTML = "";
    }
  }

  // ---- Drawing selection handles ----
  showSelectionHandles() {
    if (this.app.selectedShapes.length !== 1) return;
    const shape = this.app.selectedShapes[0];
    if (!shape) return;

    const ctx = this.app.ctx;
    const bounds = shape.getBounds();
    const pivotWorld = this._computePivot(bounds);
    const t = shape.transform;

    // rectangle corners in local coordinates measured relative to pivot (so pivot at center)
    // local coords: top-left local = (bounds.x - pivot.x, bounds.y - pivot.y)
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

    const transformedCorners = cornersLocal.map((lp) =>
      this.localToWorld(lp, t, pivotWorld)
    );

    // rotation handle: top-center local: { (bounds.x + width/2)-pivot.x, bounds.y - 30 - pivot.y }
    const topCenterLocal = {
      x: bounds.x + bounds.width / 2 - pivotWorld.x,
      y: bounds.y - pivotWorld.y,
    };
    const rotationHandleLocal = {
      x: topCenterLocal.x,
      y: topCenterLocal.y - 30, // 30 px above top
    };
    const rotationHandleWorld = this.localToWorld(
      rotationHandleLocal,
      t,
      pivotWorld
    );
    const topCenterWorld = this.localToWorld(topCenterLocal, t, pivotWorld);

    // draw
    ctx.save();
    ctx.strokeStyle = "#0078d4";
    ctx.fillStyle = "#fff";
    ctx.lineWidth = 2;

    const size = this.handleSize;
    transformedCorners.forEach((h) => {
      ctx.beginPath();
      ctx.rect(h.x - size / 2, h.y - size / 2, size, size);
      ctx.fill();
      ctx.stroke();
    });

    // rotation handle circle
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

    // line from top center to rotation handle
    ctx.beginPath();
    ctx.moveTo(topCenterWorld.x, topCenterWorld.y);
    ctx.lineTo(rotationHandleWorld.x, rotationHandleWorld.y);
    ctx.stroke();

    ctx.restore();
  }

  // ---- Mouse event handlers ----
  handleMouseDown(mousePos) {
    const shape = this.app.selectedShapes[0];
    if (!shape) return;
    const bounds = shape.getBounds();
    const pivotWorld = this._computePivot(bounds);
    const t = shape.transform;

    // compute transformed handles (use same math as drawing)
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
    const bottomRightWorld = this.localToWorld(bottomRightLocal, t, pivotWorld);
    const rotationHandleWorld = this.localToWorld(
      rotationHandleLocal,
      t,
      pivotWorld
    );

    // choose dragMode by which handle the mouse is inside
    if (this._isInsideHandle(mousePos, rotationHandleWorld)) {
      this.dragMode = "rotate";
      this.activeHandle = rotationHandleWorld;
    } else if (
      this._isInsideHandle(mousePos, topRightWorld) ||
      this._isInsideHandle(mousePos, bottomRightWorld)
    ) {
      // treat either top-right or bottom-right as scale (diagonal)
      this.dragMode = "scale";
      this.activeHandle = this._isInsideHandle(mousePos, topRightWorld)
        ? topRightWorld
        : bottomRightWorld;
    } else {
      this.dragMode = "move";
      this.activeHandle = null;
    }

    // snapshot start values (numbers only)
    this.startTransform = {
      x: t.x || 0,
      y: t.y || 0,
      rotation: t.rotation || 0,
      scaleX: t.scaleX == null ? 1 : t.scaleX,
      scaleY: t.scaleY == null ? 1 : t.scaleY,
    };

    this.startMousePos = { x: mousePos.x, y: mousePos.y };
    this.pivot = pivotWorld;
  }

  handleMouseMove(mousePos) {
    const shape = this.app.selectedShapes[0];
    if (!shape || !this.dragMode) return;

    const t = shape.transform;
    const pivot = this.pivot;

    if (this.dragMode === "move") {
      const dx = mousePos.x - this.startMousePos.x;
      const dy = mousePos.y - this.startMousePos.y;
      t.x = this.startTransform.x + dx;
      t.y = this.startTransform.y + dy;
    } else if (this.dragMode === "rotate") {
      // compute angles in world space relative to pivot
      const a1 = Math.atan2(
        this.startMousePos.y - pivot.y,
        this.startMousePos.x - pivot.x
      );
      const a2 = Math.atan2(mousePos.y - pivot.y, mousePos.x - pivot.x);
      const deltaDeg = ((a2 - a1) * 180) / Math.PI;
      t.rotation = this.startTransform.rotation + deltaDeg;
    } else if (this.dragMode === "scale") {
      // Do scaling in local space relative to pivot.
      // Convert startMouse and current mouse to local coords (pivot at origin, accounting for startTransform)
      const startLocal = this.worldToLocal(
        this.startMousePos,
        this.startTransform,
        pivot
      );
      const nowLocal = this.worldToLocal(mousePos, this.startTransform, pivot);

      // compute radial distances in local space from origin (pivot)
      const startDist = Math.hypot(startLocal.x, startLocal.y) || 1;
      const nowDist = Math.hypot(nowLocal.x, nowLocal.y);

      const ratio = nowDist / startDist;

      t.scaleX = this.startTransform.scaleX * ratio;
      t.scaleY = this.startTransform.scaleY * ratio;
    }

    // re-render & update UI
    if (
      this.app &&
      this.app.renderer &&
      typeof this.app.renderer.render === "function"
    ) {
      this.app.renderer.render();
    } else if (this.app && typeof this.app.render === "function") {
      this.app.render();
    }

    if (
      this.app &&
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

  _isInsideHandle(p, handle, size = this.handleSize) {
    return (
      p.x >= handle.x - size / 2 &&
      p.x <= handle.x + size / 2 &&
      p.y >= handle.y - size / 2 &&
      p.y <= handle.y + size / 2
    );
  }
}

export default SelectionTransformer;

// // Selection logic and interaction
// class SelectionTransformer {
//   constructor(app) {
//     this.app = app; // reference to main app instance
//     this.dragMode = null;
//     this.activeHandle = null;
//     this.startMousePos = null;
//     this.startTransform = null;
//     this.pivot = null;
//     this.handlesVisible = false;
//   }

//   hideSelectionHandles() {
//     const selectionHandles = document.getElementById("selectionHandles");
//     if (selectionHandles) {
//       selectionHandles.innerHTML = "";
//     }
//   }

//   showSelectionHandles(ctx) {
//     if (this.app.selectedShapes.length !== 1) return;

//     const shape = this.app.selectedShapes[0];
//     const bounds = shape.getBounds();
//     const pivot = shape.getCenter?.() ?? {
//       x: bounds.x + bounds.width / 2,
//       y: bounds.y + bounds.height / 2,
//     };

//     const corners = [
//       { x: bounds.x, y: bounds.y }, // top-left
//       { x: bounds.x + bounds.width, y: bounds.y }, // top-right
//       { x: bounds.x, y: bounds.y + bounds.height }, // bottom-left
//       { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // bottom-right
//     ];

//     const transformedCorners = corners.map((pt) =>
//       shape.transform.transformPoint(pt, pivot)
//     );

//     const rotationHandle = shape.transform.transformPoint(
//       { x: bounds.x + bounds.width / 2, y: bounds.y - 30 },
//       pivot
//     );

//     this.app.ctx.save();
//     this.app.ctx.strokeStyle = "#0078d4";
//     this.app.ctx.fillStyle = "#fff";
//     this.app.ctx.lineWidth = 2;

//     // Draw handles at transformed corners
//     const size = 10;
//     transformedCorners.forEach((h) => {
//       this.app.ctx.beginPath();
//       this.app.ctx.rect(h.x - size / 2, h.y - size / 2, size, size);
//       this.app.ctx.fill();
//       this.app.ctx.stroke();
//     });

//     // Draw rotation handle
//     this.app.ctx.beginPath();
//     this.app.ctx.arc(
//       rotationHandle.x,
//       rotationHandle.y,
//       size / 2,
//       0,
//       2 * Math.PI
//     );
//     this.app.ctx.fill();
//     this.app.ctx.stroke();

//     // Draw line from top-center to rotation handle
//     const topCenter = shape.transform.transformPoint(
//       { x: bounds.x + bounds.width / 2, y: bounds.y },
//       pivot
//     );
//     this.app.ctx.beginPath();
//     this.app.ctx.moveTo(topCenter.x, topCenter.y);
//     this.app.ctx.lineTo(rotationHandle.x, rotationHandle.y);
//     this.app.ctx.stroke();

//     this.app.ctx.restore();
//   }

//   handleMouseDown(mousePos) {
//     const shape = this.app.selectedShapes[0];
//     // console.log("SelectionTransformer handleMouseDown", shape);

//     if (!shape) return;
//     const bounds = shape.getBounds();
//     const pivot = shape.getCenter?.() ?? { x: 0, y: 0 };
//     const transform = shape.transform;

//     const topRight = transform.transformPoint(
//       { x: bounds.x + bounds.width, y: bounds.y },
//       pivot
//     );
//     const bottomRight = transform.transformPoint(
//       { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
//       pivot
//     );
//     const rotationHandle = transform.transformPoint(
//       { x: bounds.x + bounds.width / 2, y: bounds.y - 30 },
//       pivot
//     );

//     if (this._isInsideHandle(mousePos, rotationHandle)) {
//       this.dragMode = "rotate";
//     } else if (this._isInsideHandle(mousePos, topRight)) {
//       this.dragMode = "scale";
//     } else {
//       this.dragMode = "move";
//     }

//     this.activeHandle = topRight;
//     this.startMousePos = mousePos;
//     this.startTransform = { ...shape.transform };
//     this.pivot = pivot;
//   }

//   handleMouseMove(mousePos) {
//     const shape = this.app.selectedShapes[0];
//     if (!shape || !this.dragMode) return;
//     const dx = mousePos.x - this.startMousePos.x;
//     const dy = mousePos.y - this.startMousePos.y;

//     const pivot = this.pivot;
//     const transform = shape.transform;

//     if (this.dragMode === "move") {
//       transform.x = this.startTransform.x + dx;
//       transform.y = this.startTransform.y + dy;
//     } else if (this.dragMode === "rotate") {
//       const angle1 = Math.atan2(
//         this.startMousePos.y - pivot.y,
//         this.startMousePos.x - pivot.x
//       );
//       const angle2 = Math.atan2(mousePos.y - pivot.y, mousePos.x - pivot.x);
//       transform.rotation =
//         this.startTransform.rotation + ((angle2 - angle1) * 180) / Math.PI;
//     } else if (this.dragMode === "scale") {
//       const distStart = Math.hypot(
//         this.startMousePos.x - pivot.x,
//         this.startMousePos.y - pivot.y
//       );
//       const distNow = Math.hypot(mousePos.x - pivot.x, mousePos.y - pivot.y);
//       const scaleRatio = distNow / distStart;
//       transform.scaleX = this.startTransform.scale * scaleRatio;
//       transform.scaleY = this.startTransform.scale * scaleRatio;
//     }

//     // this.app.render();
//     this.app.renderer.render();
//     // this.app.updateTransformUI();
//     this.app.shapeManager.updateTransformUI();
//   }

//   handleMouseUp() {
//     this.dragMode = null;
//     this.activeHandle = null;
//   }

//   _isInsideHandle(p, handle, size = 10) {
//     return (
//       p.x >= handle.x - size / 2 &&
//       p.x <= handle.x + size / 2 &&
//       p.y >= handle.y - size / 2 &&
//       p.y <= handle.y + size / 2
//     );
//   }
// }

// export default SelectionTransformer;
