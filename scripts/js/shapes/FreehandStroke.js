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
  // Adds a point to the stroke and re-smooths it
  addPoint(point) {
    // Always store as Point instance
    const pt = point instanceof Point ? point : new Point(point.x, point.y);
    this.points.push(pt);
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
  // Douglas-Peucker Algorithm for stroke smoothing
  // points: array of Point instances representing the stroke
  // epsilon: threshold for maximum allowed deviation (smoothing factor)
  // dmax: maximum perpendicular distance found between a point and the line segment (start to end)
  // index: index of the point with maximum distance
  // end: index of the last point in the array
  // d: perpendicular distance from points[i] to the line segment (points[0] to points[end])
  // recResults1: recursively simplified points from start to index
  // recResults2: recursively simplified points from index to end
  // Returns: array of Points representing the simplified (smoothed) stroke
  douglasPeucker(points, epsilon) {
    if (points.length <= 2) return points;
    let dmax = 0; // max perpendicular distance
    let index = 0; // index of point with max distance
    const end = points.length - 1; // last point index
    for (let i = 1; i < end; i++) {
      // Compute perpendicular distance from points[i] to line (points[0] to points[end])
      const d = this.perpendicularDistance(points[i], points[0], points[end]);
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }
    // If max distance exceeds epsilon, recursively simplify
    if (dmax > epsilon) {
      // Recursively process first segment (start to index)
      const recResults1 = this.douglasPeucker(
        points.slice(0, index + 1),
        epsilon
      );
      // Recursively process second segment (index to end)
      const recResults2 = this.douglasPeucker(points.slice(index), epsilon);
      // Concatenate results, removing duplicate at join
      return recResults1.slice(0, -1).concat(recResults2);
    } else {
      // If no point exceeds epsilon, keep only endpoints
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
  // Calculates the shortest distance from a point to a line segment
  // A, B: vector from lineStart to point
  // C, D: vector from lineStart to lineEnd
  // dot: dot product of vectors (A,B) and (C,D)
  // lenSq: squared length of the line segment
  // param: normalized position of the projection on the segment (0=start, 1=end)
  // xx, yy: coordinates of the closest point on the segment to 'point'
  // dx, dy: vector from 'point' to closest point on segment
  // Returns: Euclidean distance from 'point' to the segment
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
  clone() {
    const stroke = new FreehandStroke(
      this.smoothingEpsilon,
      this.smoothingEnabled
    );
    stroke.points = this.points
      ? this.points.map((pt) => new Point(pt.x + 1, pt.y))
      : [];
    // Recompute smoothedPoints based on cloned points and smoothing settings
    if (stroke.smoothingEnabled) {
      const epsilon =
        typeof stroke.smoothingEpsilon === "number" &&
        !isNaN(stroke.smoothingEpsilon) &&
        stroke.smoothingEpsilon > 0
          ? stroke.smoothingEpsilon
          : 2;
      stroke.smoothedPoints = stroke.douglasPeucker(stroke.points, epsilon);
    } else {
      stroke.smoothedPoints = [...stroke.points];
    }
    stroke.strokeColor = this.strokeColor;
    stroke.strokeWidth = this.strokeWidth;
    stroke.transform = this.transform ? this.transform.clone() : null;
    return stroke;
  }
}
export default FreehandStroke;
