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
  clone() {
    const rect = new RectangleShape();
    rect.x = this.x + 1;
    rect.y = this.y + 1;
    rect.width = this.width;
    rect.height = this.height;
    rect.strokeColor = this.strokeColor;
    rect.strokeWidth = this.strokeWidth;
    rect.fillColor = this.fillColor;
    rect.fillEnabled = this.fillEnabled;
    rect.transform = this.transform ? this.transform.clone() : null;
    rect.visible = this.visible;
    return rect;
  }
}
export default RectangleShape;
