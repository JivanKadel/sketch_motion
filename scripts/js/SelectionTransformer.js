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

  //   showSelectionHandles() {
  //     this.handlesVisible = true;
  //     this.app.render();
  //   }
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
      shape.transform.transformPoint(pt, pivot,shape)
    );

    const rotationHandle = shape.transform.transformPoint(
      { x: bounds.x + bounds.width / 2, y: bounds.y - 30 },
      pivot,
      shape
    );

    ctx.save();
    ctx.strokeStyle = "#0078d4";
    ctx.fillStyle = "#fff";
    ctx.lineWidth = 2;

    // Draw handles at transformed corners
    const size = 10;
    transformedCorners.forEach((h) => {
      ctx.beginPath();
      ctx.rect(h.x - size / 2, h.y - size / 2, size, size);
      ctx.fill();
      ctx.stroke();
    });

    // Draw rotation handle
    ctx.beginPath();
    ctx.arc(rotationHandle.x, rotationHandle.y, size / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw line from top-center to rotation handle
    const topCenter = shape.transform.transformPoint(
      { x: bounds.x + bounds.width / 2, y: bounds.y },
      pivot,
      shape
    );
    ctx.beginPath();
    ctx.moveTo(topCenter.x, topCenter.y);
    ctx.lineTo(rotationHandle.x, rotationHandle.y);
    ctx.stroke();

    ctx.restore();
  }

  drawHandles(ctx) {
    const shape = this.app.selectedShapes[0];
    if (!shape || !this.handlesVisible) return;

    const bounds = shape.getBounds();
    const handleSize = 10;
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
    ctx.strokeStyle = "#0078d4";
    ctx.fillStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

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
  }

  handleMouseDown(mousePos) {
    const shape = this.app.selectedShapes[0];
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
      transform.scaleX = this.startTransform.scaleX * scaleRatio;
      transform.scaleY = this.startTransform.scaleY * scaleRatio;
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

//   //   showSelectionHandles() {
//   //     this.handlesVisible = true;
//   //     this.app.render();
//   //   }
//   showSelectionHandles(ctx) {
//     if (this.selectedShapes.length !== 1) return;

//     const shape = this.selectedShapes[0];
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

//     ctx.save();
//     ctx.strokeStyle = "#0078d4";
//     ctx.fillStyle = "#fff";
//     ctx.lineWidth = 2;

//     // Draw handles at transformed corners
//     const size = 10;
//     transformedCorners.forEach((h) => {
//       ctx.beginPath();
//       ctx.rect(h.x - size / 2, h.y - size / 2, size, size);
//       ctx.fill();
//       ctx.stroke();
//     });

//     // Draw rotation handle
//     ctx.beginPath();
//     ctx.arc(rotationHandle.x, rotationHandle.y, size / 2, 0, 2 * Math.PI);
//     ctx.fill();
//     ctx.stroke();

//     // Draw line from top-center to rotation handle
//     const topCenter = shape.transform.transformPoint(
//       { x: bounds.x + bounds.width / 2, y: bounds.y },
//       pivot
//     );
//     ctx.beginPath();
//     ctx.moveTo(topCenter.x, topCenter.y);
//     ctx.lineTo(rotationHandle.x, rotationHandle.y);
//     ctx.stroke();

//     ctx.restore();
//   }

//   drawHandles(ctx) {
//     const shape = this.app.selectedShapes[0];
//     if (!shape || !this.handlesVisible) return;

//     const bounds = shape.getBounds();
//     const handleSize = 10;
//     const pivot = shape.getCenter?.() ?? { x: 0, y: 0 };
//     const transform = shape.transform;

//     const topLeft = transform.transformPoint(
//       { x: bounds.x, y: bounds.y },
//       pivot
//     );
//     const topRight = transform.transformPoint(
//       { x: bounds.x + bounds.width, y: bounds.y },
//       pivot
//     );
//     const bottomLeft = transform.transformPoint(
//       { x: bounds.x, y: bounds.y + bounds.height },
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

//     ctx.save();
//     ctx.strokeStyle = "#0078d4";
//     ctx.fillStyle = "#fff";
//     ctx.lineWidth = 2;
//     ctx.setLineDash([]);

//     const handles = [topLeft, topRight, bottomLeft, bottomRight];
//     handles.forEach((h) => {
//       ctx.beginPath();
//       ctx.rect(
//         h.x - handleSize / 2,
//         h.y - handleSize / 2,
//         handleSize,
//         handleSize
//       );
//       ctx.fill();
//       ctx.stroke();
//     });

//     ctx.beginPath();
//     ctx.arc(rotationHandle.x, rotationHandle.y, handleSize / 2, 0, 2 * Math.PI);
//     ctx.fill();
//     ctx.stroke();

//     ctx.beginPath();
//     ctx.moveTo((topLeft.x + topRight.x) / 2, (topLeft.y + topRight.y) / 2);
//     ctx.lineTo(rotationHandle.x, rotationHandle.y);
//     ctx.stroke();

//     ctx.restore();
//   }

//   handleMouseDown(mousePos) {
//     const shape = this.app.selectedShapes[0];
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
//       transform.scaleX = this.startTransform.scaleX * scaleRatio;
//       transform.scaleY = this.startTransform.scaleY * scaleRatio;
//     }

//     this.app.render();
//     this.app.updateTransformUI();
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

// class SelectionTransformer {
//   constructor(app) {
//     this.app = app; // reference to main app instance
//     this.dragMode = null;
//     this.activeHandle = null;
//     this.startMousePos = null;
//     this.startTransform = null;
//     this.pivot = null;
//   }

//   showSelectionHandles() {
//     const shape = this.app.selectedShapes[0];
//     if (!shape) return;

//     const bounds = shape.getBounds();
//     const handleSize = 10;
//     const ctx = this.app.ctx;
//     const pivot = shape.getCenter?.() ?? { x: 0, y: 0 };
//     const transform = shape.transform;

//     const topLeft = transform.transformPoint(
//       { x: bounds.x, y: bounds.y },
//       pivot
//     );
//     const topRight = transform.transformPoint(
//       { x: bounds.x + bounds.width, y: bounds.y },
//       pivot
//     );
//     const bottomLeft = transform.transformPoint(
//       { x: bounds.x, y: bounds.y + bounds.height },
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

//     ctx.save();
//     ctx.strokeStyle = "#0078d4";
//     ctx.fillStyle = "#fff";
//     ctx.lineWidth = 2;
//     ctx.setLineDash([]);

//     const handles = [topLeft, topRight, bottomLeft, bottomRight];
//     handles.forEach((h) => {
//       ctx.beginPath();
//       ctx.rect(
//         h.x - handleSize / 2,
//         h.y - handleSize / 2,
//         handleSize,
//         handleSize
//       );
//       ctx.fill();
//       ctx.stroke();
//     });

//     ctx.beginPath();
//     ctx.arc(rotationHandle.x, rotationHandle.y, handleSize / 2, 0, 2 * Math.PI);
//     ctx.fill();
//     ctx.stroke();

//     ctx.beginPath();
//     ctx.moveTo((topLeft.x + topRight.x) / 2, (topLeft.y + topRight.y) / 2);
//     ctx.lineTo(rotationHandle.x, rotationHandle.y);
//     ctx.stroke();

//     ctx.restore();
//   }

//   handleMouseDown(mousePos) {
//     const shape = this.app.selectedShapes[0];
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
//       transform.scaleX = this.startTransform.scaleX * scaleRatio;
//       transform.scaleY = this.startTransform.scaleY * scaleRatio;
//     }

//     this.app.render();
//     this.app.updateTransformUI();
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
