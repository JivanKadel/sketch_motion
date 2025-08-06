import Point from "../core/Point.js";
import Shape from "./Shape.js";
// Represents a freehand drawing stroke
class FreehandStroke extends Shape {
  constructor(smoothingEpsilon = 0, smoothingEnabled = true) {
    super();
    this.points = [];
    this.smoothedPoints = [];
    this.smoothingEpsilon = smoothingEpsilon;
    this.smoothingEnabled = smoothingEnabled;
  }
  // Adds a point to the stroke and re-smoothes it
  addPoint(point) {
    this.points.push(point);
    if (this.smoothingEnabled) {
      const epsilon =
        typeof this.smoothingEpsilon === "number" &&
        !isNaN(this.smoothingEpsilon) &&
        this.smoothingEpsilon > 0
          ? this.smoothingEpsilon
          : 2;
      this.smoothedPoints = this.douglasPeucker(this.points, epsilon);
    } else {
      // No smoothing, use raw points
      this.smoothedPoints = [...this.points];
    }
  }
  // Douglas-Peucker Algorithm for stroke smoothing
  douglasPeucker(points, epsilon) {
    if (points.length <= 2) return points;
    let dmax = 0;
    let index = 0;
    const end = points.length - 1;
    for (let i = 1; i < end; i++) {
      const d = this.perpendicularDistance(points[i], points[0], points[end]);
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }
    if (dmax > epsilon) {
      const recResults1 = this.douglasPeucker(
        points.slice(0, index + 1),
        epsilon
      );
      const recResults2 = this.douglasPeucker(points.slice(index), epsilon);
      return recResults1.slice(0, -1).concat(recResults2);
    } else {
      return [points[0], points[end]];
    }
  }
  // Calculates the perpendicular distance from a point to a line segment
  perpendicularDistance(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    if (dx === 0 && dy === 0) {
      return point.distance(lineStart);
    }
    const t =
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
      (dx * dx + dy * dy);
    const projection = new Point(lineStart.x + t * dx, lineStart.y + t * dy);
    return point.distance(projection);
  }
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
  // Draws the smoothed freehand stroke
  drawShape(ctx) {
    if (this.smoothedPoints.length < 2) return;
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.smoothedPoints[0].x, this.smoothedPoints[0].y);
    for (let i = 1; i < this.smoothedPoints.length; i++) {
      ctx.lineTo(this.smoothedPoints[i].x, this.smoothedPoints[i].y);
    }
    ctx.stroke();
  }
  // Gets the bounding box of the freehand stroke
  getBounds() {
    if (this.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = this.points[0].x,
      maxX = this.points[0].x;
    let minY = this.points[0].y,
      maxY = this.points[0].y;
    for (const point of this.points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  // Checks if a point is contained within the freehand stroke (near any segment)
  containsPoint(point) {
    for (let i = 0; i < this.smoothedPoints.length - 1; i++) {
      const dist = this.distanceToLine(
        point,
        this.smoothedPoints[i],
        this.smoothedPoints[i + 1]
      );
      if (dist <= this.strokeWidth / 2 + 3) return true;
    }
    return false;
  }
}
export default FreehandStroke;
