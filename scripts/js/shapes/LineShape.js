import Point from "../core/Point.js";
import Shape from "./Shape.js";
// Represents a line shape
class LineShape extends Shape {
  constructor(start, end) {
    super();
    this.start = start || new Point(0, 0);
    this.end = end || new Point(100, 100);
  }
  // Draws the line
  drawShape(ctx) {
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);
    ctx.stroke();
  }
  // Gets the bounding box of the line
  getBounds() {
    const minX = Math.min(this.start.x, this.end.x);
    const minY = Math.min(this.start.y, this.end.y);
    const maxX = Math.max(this.start.x, this.end.x);
    const maxY = Math.max(this.start.y, this.end.y);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  // Checks if a point is near the line
  containsPoint(point) {
    const dist = this.distanceToLine(point, this.start, this.end);
    return dist <= this.strokeWidth / 2 + 3;
  }
  // Calculates the perpendicular distance from a point to a line segment
  distanceToLine(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;
    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }
    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
  clone() {
    const line = new LineShape();
    line.start = new Point(this.start.x + 10, this.start.y);
    line.end = new Point(this.end.x + 10, this.end.y);
    line.strokeColor = this.strokeColor;
    line.strokeWidth = this.strokeWidth;
    line.transform = this.transform ? this.transform.clone() : null;
    line.visible = this.visible;
    // ...copy any other relevant properties...
    return line;
  }
}
export default LineShape;
