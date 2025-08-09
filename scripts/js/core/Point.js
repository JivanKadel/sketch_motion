// Represents a point in 2D space
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  // Calculates the distance to another point
  distance(other) {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
  }
  // Adds another point's coordinates to this point
  add(other) {
    return new Point(this.x + other.x, this.y + other.y);
  }
  // Subtracts another point's coordinates from this point
  subtract(other) {
    return new Point(this.x - other.x, this.y - other.y);
  }
  // Multiplies the point's coordinates by a scalar
  multiply(scalar) {
    return new Point(this.x * scalar, this.y * scalar);
  }
}
export default Point;
