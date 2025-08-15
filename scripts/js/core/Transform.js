class Transform {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.rotation = 0;
    this.skewX = 0;
    this.skewY = 0;
  }

  // Unified scale property
  get scale() {
    return (this.scaleX + this.scaleY) / 2;
  }

  set scale(s) {
    this.scaleX = s;
    this.scaleY = s;
  }

  // Apply transformation relative to a pivot point (e.g., shape center)
  applyToContext(ctx, shape) {
    ctx.translate(this.x, this.y);

    // Move pivot to origin
    // ctx.translate(-pivot.x, -pivot.y);
    ctx.translate(shape.x, shape.y);
    // Rotation
    ctx.rotate((this.rotation * Math.PI) / 180);

    // Scale
    ctx.scale(this.scaleX, this.scaleY);

    // Skew
    const skewXRad = (this.skewX * Math.PI) / 180;
    const skewYRad = (this.skewY * Math.PI) / 180;
    ctx.transform(1, Math.tan(skewYRad), Math.tan(skewXRad), 1, 0, 0);

    // Move pivot back
    // ctx.translate(pivot.x, pivot.y);


  }

  // Transform a point with optional pivot
  transformPoint(point, pivot = { x: 0, y: 0 },shape= { width: 0, height: 0 }) {
    // Translate to pivot
    let x = point.x - pivot.x;
    let y = point.y - pivot.y;

    // Skew
    const skewXRad = (this.skewX * Math.PI) / 180;
    const skewYRad = (this.skewY * Math.PI) / 180;
    x = x + y * Math.tan(skewXRad);
    y = y + x * Math.tan(skewYRad);

    // Scale
    x *= this.scaleX;
    y *= this.scaleY;

    // Rotate
    const rad = (this.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rotX = x * cos - y * sin;
    const rotY = x * sin + y * cos;

    // Translate back + position
    return {
      x: rotX + pivot.x + this.x- shape.width/2,
      y: rotY + pivot.y + this.y- shape.height/2,
    };
  }

  // Inverse of transformPoint (screen → local)
  inverseTransformPoint(point, pivot = { x: 0, y: 0 }) {
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

    // Inverse skew
    const skewXRad = (this.skewX * Math.PI) / 180;
    const skewYRad = (this.skewY * Math.PI) / 180;
    const invX = rotX - rotY * Math.tan(skewXRad);
    const invY = rotY - rotX * Math.tan(skewYRad);

    // Move pivot back
    return {
      x: invX + pivot.x,
      y: invY + pivot.y,
    };
  }
}

export default Transform;

// // Represents the transformation properties of a shape
// class Transform {
//   constructor() {
//     this.x = 0;
//     this.y = 0;
//     this.scaleX = 1;
//     this.scaleY = 1;
//     this.rotation = 0;
//     this.skewX = 0;
//     this.skewY = 0;
//   }

//   // Unified scale property
//   get scale() {
//     return (this.scaleX + this.scaleY) / 2;
//   }

//   set scale(s) {
//     this.scaleX = s;
//     this.scaleY = s;
//   }

//   // Applies the transform to a CanvasRenderingContext2D
//   applyToContext(ctx) {
//     // Apply translation last
//     // Step 1: Move origin to (x, y)
//     ctx.translate(this.x, this.y);

//     // Step 2: Apply rotation
//     ctx.rotate((this.rotation * Math.PI) / 180);

//     // Step 3: Apply scaling
//     ctx.scale(this.scaleX, this.scaleY);

//     // Step 4: Apply skew (shear)
//     const skewXRad = (this.skewX * Math.PI) / 180;
//     const skewYRad = (this.skewY * Math.PI) / 180;
//     ctx.transform(1, Math.tan(skewYRad), Math.tan(skewXRad), 1, 0, 0);
//   }

//   // Transforms a given point by applying this transform
//   transformPoint(point) {
//     // Apply skew
//     const skewXRad = (this.skewX * Math.PI) / 180;
//     const skewYRad = (this.skewY * Math.PI) / 180;
//     let x = point.x + point.y * Math.tan(skewXRad);
//     let y = point.y + point.x * Math.tan(skewYRad);

//     // Apply scaling
//     x *= this.scaleX;
//     y *= this.scaleY;

//     // Apply rotation
//     const angle = (this.rotation * Math.PI) / 180;
//     const cos = Math.cos(angle);
//     const sin = Math.sin(angle);
//     const rotX = x * cos - y * sin;
//     const rotY = x * sin + y * cos;

//     // Apply translation
//     return { x: rotX + this.x, y: rotY + this.y };
//   }
// }

// export default Transform;

// // Represents the transformation properties of a shape
// class Transform {
//   constructor() {
//     this.x = 0;
//     this.y = 0;
//     this.scaleX = 1;
//     this.scaleY = 1;
//     this.rotation = 0;
//     this.skewX = 0;
//     this.skewY = 0;
//   }
//   // Applies the transform to a CanvasRenderingContext2D
//   applyToContext(ctx) {
//     // Apply translation
//     ctx.translate(this.x, this.y);

//     // Apply skew (shear) using transform matrix
//     const skewXRad = (this.skewX * Math.PI) / 180;
//     const skewYRad = (this.skewY * Math.PI) / 180;
//     ctx.transform(1, Math.tan(skewYRad), Math.tan(skewXRad), 1, 0, 0);

//     // Apply scaling
//     ctx.scale(this.scaleX, this.scaleY);

//     // Apply rotation
//     ctx.rotate((this.rotation * Math.PI) / 180);
//   }
//   // Transforms a given point by applying this transform
//   transformPoint(point) {
//     // Apply skew
//     const skewXRad = (this.skewX * Math.PI) / 180;
//     const skewYRad = (this.skewY * Math.PI) / 180;
//     let x = point.x + point.y * Math.tan(skewXRad);
//     let y = point.y + point.x * Math.tan(skewYRad);

//     // Apply scaling
//     x *= this.scaleX;
//     y *= this.scaleY;

//     // Apply rotation
//     const cos = Math.cos((this.rotation * Math.PI) / 180);
//     const sin = Math.sin((this.rotation * Math.PI) / 180);
//     const rotX = x * cos - y * sin;
//     const rotY = x * sin + y * cos;

//     // Apply translation
//     return { x: rotX + this.x, y: rotY + this.y };
//   }
// }
// export default Transform;
