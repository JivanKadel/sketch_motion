import Shape from "./Shape.js";
// Represents an oval shape
class OvalShape extends Shape {
  constructor(centerX, centerY, radiusX, radiusY) {
    super();
    this.centerX = centerX || 50;
    this.centerY = centerY || 50;
    this.radiusX = radiusX || 75;
    this.radiusY = radiusY || 50;
  }
  // Draws the oval
  drawShape(ctx) {
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.beginPath();
    ctx.ellipse(
      this.centerX,
      this.centerY,
      this.radiusX,
      this.radiusY,
      0,
      0,
      2 * Math.PI
    );
    if (this.fillEnabled) {
      ctx.fillStyle = this.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  }
  // Gets the bounding box of the oval
  getBounds() {
    return {
      x: this.centerX - this.radiusX,
      y: this.centerY - this.radiusY,
      width: this.radiusX * 2,
      height: this.radiusY * 2,
    };
  }
  // Checks if a point is contained within the oval
  containsPoint(point) {
    const dx = (point.x - this.centerX) / this.radiusX;
    const dy = (point.y - this.centerY) / this.radiusY;
    return dx * dx + dy * dy <= 1;
  }
  clone() {
    const oval = new OvalShape();
    oval.centerX = this.centerX + 10;
    oval.centerY = this.centerY;
    oval.radiusX = this.radiusX;
    oval.radiusY = this.radiusY;
    oval.strokeColor = this.strokeColor;
    oval.strokeWidth = this.strokeWidth;
    oval.fillColor = this.fillColor;
    oval.fillEnabled = this.fillEnabled;
    oval.transform = this.transform ? this.transform.clone() : null;
    oval.visible = this.visible;
    // ...copy any other relevant properties...
    return oval;
  }
}
export default OvalShape;
