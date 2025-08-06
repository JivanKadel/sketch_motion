import Shape from "./Shape.js";
// Represents a rectangle shape
class RectangleShape extends Shape {
  constructor(x, y, width, height) {
    super();
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 100;
    this.height = height || 100;
  }
  // Draws the rectangle
  drawShape(ctx) {
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    if (this.fillEnabled) {
      ctx.fillStyle = this.fillColor;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
  // Gets the bounding box of the rectangle
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
  // Checks if a point is contained within the rectangle
  containsPoint(point) {
    return (
      point.x >= this.x &&
      point.x <= this.x + this.width &&
      point.y >= this.y &&
      point.y <= this.y + this.height
    );
  }
}
export default RectangleShape;
