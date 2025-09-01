import Shape from "./Shape.js";
// Represents a diamond shape
class DiamondShape extends Shape {
  constructor(centerX, centerY, width, height) {
    super();
    this.centerX = centerX || 50;
    this.centerY = centerY || 50;
    this.width = width || 100;
    this.height = height || 100;
  }
  // Draws the diamond
  drawShape(ctx) {
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    ctx.beginPath();
    ctx.moveTo(this.centerX, this.centerY - halfHeight); // Top
    ctx.lineTo(this.centerX + halfWidth, this.centerY); // Right
    ctx.lineTo(this.centerX, this.centerY + halfHeight); // Bottom
    ctx.lineTo(this.centerX - halfWidth, this.centerY); // Left
    ctx.closePath();
    if (this.fillEnabled) {
      ctx.fillStyle = this.fillColor;
      ctx.fill();
    }
    ctx.stroke();
  }
  // Gets the bounding box of the diamond
  getBounds() {
    return {
      x: this.centerX - this.width / 2,
      y: this.centerY - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }
  // Checks if a point is contained within the diamond
  containsPoint(point) {
    const dx = Math.abs(point.x - this.centerX);
    const dy = Math.abs(point.y - this.centerY);
    return dx / (this.width / 2) + dy / (this.height / 2) <= 1;
  }
  clone() {
    const diamond = new DiamondShape();
    diamond.centerX = this.centerX + 10;
    diamond.centerY = this.centerY;
    diamond.width = this.width;
    diamond.height = this.height;
    diamond.strokeColor = this.strokeColor;
    diamond.strokeWidth = this.strokeWidth;
    diamond.fillColor = this.fillColor;
    diamond.fillEnabled = this.fillEnabled;
    diamond.transform = this.transform ? this.transform.clone() : null;
    diamond.visible = this.visible;
    // ...copy any other relevant properties...
    return diamond;
  }
}
export default DiamondShape;
