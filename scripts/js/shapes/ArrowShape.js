import LineShape from "./LineShape.js"; 
// Represents an arrow shape
class ArrowShape extends LineShape {
  constructor(start, end) {
    super(start, end);
    this.headSize = 15;
  }
  // Draws the arrow, including the line and arrowhead
  drawShape(ctx) {
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    // Draw line
    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);
    ctx.stroke();
    // Draw arrowhead
    const angle = Math.atan2(
      this.end.y - this.start.y,
      this.end.x - this.start.x
    );
    // Arrowhead size proportional to line length and stroke width
    const lineLength = this.start.distance(this.end);
    const headlen =
      Math.max(12, Math.max(lineLength * 0.1, 12)) + this.strokeWidth * 1.5;
    ctx.beginPath();
    ctx.moveTo(this.end.x, this.end.y);
    ctx.lineTo(
      this.end.x - headlen * Math.cos(angle - Math.PI / 5),
      this.end.y - headlen * Math.sin(angle - Math.PI / 5)
    );
    ctx.moveTo(this.end.x, this.end.y);
    ctx.lineTo(
      this.end.x - headlen * Math.cos(angle + Math.PI / 5),
      this.end.y - headlen * Math.sin(angle + Math.PI / 5)
    );
    ctx.stroke();
  }
  // Overrides getBounds to account for arrowhead size
  getBounds() {
    const minX = Math.min(this.start.x, this.end.x) - this.headSize;
    const minY = Math.min(this.start.y, this.end.y) - this.headSize;
    const maxX = Math.max(this.start.x, this.end.x) + this.headSize;
    const maxY = Math.max(this.start.y, this.end.y) + this.headSize;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  // Checks if a point is contained within the arrow (line segment + arrowhead consideration)
  containsPoint(point) {
    return (
      this.distanceToLine(point, this.start, this.end) <=
      this.strokeWidth / 2 + 3
    );
  }
}
export default ArrowShape;
