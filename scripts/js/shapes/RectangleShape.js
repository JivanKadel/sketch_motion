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
  drawShape(ctx,scale = { scaleX : 1, scaleY : 1 }, rotate= {centerX : 0, centerY : 0}) {
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth/((scale.scaleX + scale.scaleY)/2);
    if (this.fillEnabled) {
      ctx.fillStyle = this.fillColor;
      ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    }
    ctx.strokeRect(-this.width/2,-this.height/2, this.width, this.height);
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

  getCenter() {
    return {
        x : this.x + this.width/2,
        y: this.y + this.height/2
    }
  }
}
export default RectangleShape;
