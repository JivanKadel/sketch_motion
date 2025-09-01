class Transform {
  constructor(width = 0, height = 0) {
    this.x = 0; // world position
    this.y = 0;
    this.scale = 1; // unified scale
    this.scaleX = this.scale; // individual scales
    this.scaleY = this.scale;
    this.rotation = 0; // degrees
    this.width = width; // object width
    this.height = height; // object height
  }

  // Unified scale property
  get scale() {
    return (this.scaleX + this.scaleY) / 2;
  }

  set scale(s) {
    this.scaleX = s;
    this.scaleY = s;
  }

  clone() {
    const t = new Transform();
    t.translateX = this.translateX;
    t.translateY = this.translateY;
    t.scaleX = this.scaleX;
    t.scaleY = this.scaleY;
    t.rotation = this.rotation;
    t.width = this.width;
    t.height = this.height;
    return t;
  }

  // Apply transformations around the shape's bounding box center
  applyToContext(ctx, shapeBounds = null) {
    // Use provided bounds if exists else use width/height
    const bounds = shapeBounds || {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
    };
    const pivot = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };

    // Step 1: Translate to shape's center
    ctx.translate(pivot.x, pivot.y);

    // Step 2: Apply rotation and scaling around center
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(this.scaleX, this.scaleY);

    // Step 3: Move back to original coordinate system
    ctx.translate(-pivot.x, -pivot.y);
  }

  // Transform a point from local --> world with custom pivot
  transformPoint(point, shapeBounds = null) {
    // Use provided bounds if provided else use width/height centered at origin
    const bounds = shapeBounds || {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
    };
    const pivot = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };

    // Convert to local coordinates relative to pivot
    let x = point.x - pivot.x;
    let y = point.y - pivot.y;

    // Scale
    let scaledX = x * this.scaleX;
    let scaledY = y * this.scaleY;

    // Rotate
    const rad = (this.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    let rotatedX = scaledX * cos - scaledY * sin;
    let rotatedY = scaledX * sin + scaledY * cos;

    // Translate back from pivot
    return {
      x: rotatedX + pivot.x,
      y: rotatedY + pivot.y,
    };
  }

  // Transform a point from world --> local with custom pivot
  inverseTransformPoint(point, shapeBounds = null) {
    // Use provided bounds if provided else use width/height centered at origin
    const bounds = shapeBounds || {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
    };
    const pivot = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };

    // Convert to object space
    let x = point.x - pivot.x;
    let y = point.y - pivot.y;

    // Inverse rotate
    const rad = -(this.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    let rotX = x * cos - y * sin;
    let rotY = x * sin + y * cos;

    // Inverse scale
    if (this.scaleX !== 0) rotX /= this.scaleX;
    if (this.scaleY !== 0) rotY /= this.scaleY;

    // Translate back from pivot
    return {
      x: rotX + pivot.x,
      y: rotY + pivot.y,
    };
  }
}

export default Transform;
