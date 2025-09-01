import Transform from "../core/Transform.js";
// Base class for all shapes
class Shape {
  constructor() {
    this.id = Math.random().toString(36).substr(2, 9);
    this.strokeColor = "rgba(0, 0, 0, 1)";
    this.strokeWidth = 2;
    this.fillColor = "#ffffff";
    this.fillEnabled = false;
    this.transform = new Transform();
    this.selected = false;
    this.visible = true;
  }
  // Draws the shape on the canvas context
  draw(ctx) {
    ctx.save();
    // Gets current bounds and pass to transform
    const bounds = this.getBounds();
    this.transform.width = bounds.width;
    this.transform.height = bounds.height;
    this.transform.applyToContext(ctx, bounds);
    this.drawShape(ctx);
    ctx.restore();
  }
  // Abstract method to be overridden by subclasses for actual drawing
  drawShape(ctx) {
    // Override in subclasses
  }
  // Abstract method to get the bounding box of the shape
  getBounds() {
    // Override in subclasses
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  // Abstract method to check if a point is contained within the shape
  containsPoint(point) {
    // Override in subclasses
    return false;
  }

  // Gets the center point of the shape based on its bounds
  getCenter() {
    const bounds = this.getBounds();
    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
  }

  // Creates a clone of the shape
  clone() {
    const cloned = new this.constructor();
    cloned.strokeColor = this.strokeColor;
    cloned.strokeWidth = this.strokeWidth;
    cloned.fillColor = this.fillColor;
    cloned.fillEnabled = this.fillEnabled;
    cloned.transform = Object.assign(new Transform(), this.transform);
    return cloned;
  }
}
export default Shape;
