import Shape from "./Shape.js";
// Represents a circle shape
class CircleShape extends Shape {
  constructor(centerX, centerY, radius) {
    super();
    this.centerX = centerX || 50;
    this.centerY = centerY || 50;
    this.radius = radius || 50;
  }
  // Draws the circle
  drawShape(ctx) {
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
    if (this.fillEnabled) {
      ctx.fillStyle = this.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  }
  // Gets the bounding box of the circle
  getBounds() {
    return {
      x: this.centerX - this.radius,
      y: this.centerY - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
  }
  // Checks if a point is contained within the circle
  containsPoint(point) {
    const distance = Math.sqrt(
      (point.x - this.centerX) ** 2 + (point.y - this.centerY) ** 2
    );
    return distance <= this.radius;
  }
  clone() {
    const circle = new CircleShape();
    circle.centerX = this.centerX + 1;
    circle.centerY = this.centerY + 1;
    circle.radius = this.radius;
    circle.strokeColor = this.strokeColor;
    circle.strokeWidth = this.strokeWidth;
    circle.fillColor = this.fillColor;
    circle.fillEnabled = this.fillEnabled;
    circle.transform = this.transform ? this.transform.clone() : null;
    circle.visible = this.visible;
    return circle;
  }
}
export default CircleShape;
