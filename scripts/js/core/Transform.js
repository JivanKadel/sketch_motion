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

  // Always rotate/scale around the object's center
  applyToContext(ctx) {
    const pivot = { x: this.width / 2, y: this.height / 2 };

    ctx.translate(this.x, this.y); // Move to object position
    ctx.translate(pivot.x, pivot.y); // Move center to origin
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(this.scaleX, this.scaleY);
    ctx.translate(-pivot.x, -pivot.y); // Move back
  }

  // Transform a point from local → world
  transformPoint(point) {
    const pivot = { x: this.width / 2, y: this.height / 2 };

    // Convert to local coords
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

    // Translate back from pivot, then to world position
    return {
      x: rotatedX + pivot.x + this.x,
      y: rotatedY + pivot.y + this.y,
    };
  }

  // Transform a point from world → local
  inverseTransformPoint(point) {
    const pivot = { x: this.width / 2, y: this.height / 2 };

    // Convert to object space
    let x = point.x - this.x - pivot.x;
    let y = point.y - this.y - pivot.y;

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
