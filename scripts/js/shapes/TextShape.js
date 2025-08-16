import Shape from "./Shape.js";
// Represents a text shape
class TextShape extends Shape {
  constructor(x, y, text, fontSize) {
    super();
    this.x = x || 0;
    this.y = y || 0;
    this.text = text || "Text";
    this.fontSize = fontSize || 16;
    this.fontFamily = "Arial"; // Default font family
  }
  // Draws the text
  drawShape(ctx) {
    ctx.fillStyle = this.strokeColor; // Text color
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textBaseline = "top"; // Align text from the top
    ctx.fillText(this.text, this.x, this.y);
  }
  // Gets the approximate bounding box of the text
  getBounds() {
    // Approximate text bounds, actual width depends on font metrics
    const width = this.text.length * this.fontSize * 0.6;
    const height = this.fontSize;
    return { x: this.x, y: this.y, width, height };
  }
  // Checks if a point is contained within the text's bounding box
  containsPoint(point) {
    const bounds = this.getBounds();
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }
}
export default TextShape;
