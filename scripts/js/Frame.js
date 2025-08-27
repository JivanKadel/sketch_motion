// Represents a single frame in the animation
class Frame {
  constructor() {
    this.id = Math.random().toString(36).substr(2, 9);
    this.shapes = [];
    this.thumbnail = null; // Stores a data URL of the frame's thumbnail
  }
  // Adds a shape to the frame
  addShape(shape) {
    this.shapes.push(shape);
  }
  // Removes a shape from the frame
  removeShape(shape) {
    const index = this.shapes.indexOf(shape);
    if (index > -1) {
      this.shapes.splice(index, 1);
    }
  }
  // Draws all shapes in the frame onto the given canvas context
  draw(ctx) {
    for (const shape of this.shapes) {
      if (shape.visible) {
        shape.draw(ctx);
      }
    }
  }
  // Generates a thumbnail image for the frame from a source canvas
  generateThumbnail(sourceCanvas) {
    const thumbnailCanvas = document.createElement("canvas");
    thumbnailCanvas.width = 80;
    thumbnailCanvas.height = 60;
    const thumbnailCtx = thumbnailCanvas.getContext("2d");
    if (!thumbnailCtx) return; // Ensure context is available
    thumbnailCtx.fillStyle = "white";
    thumbnailCtx.fillRect(0, 0, 80, 60);
    // Calculate scale to fit content within thumbnail
    const scale = Math.min(80 / sourceCanvas.width, 60 / sourceCanvas.height);
    const scaledWidth = sourceCanvas.width * scale;
    const scaledHeight = sourceCanvas.height * scale;
    const offsetX = (80 - scaledWidth) / 2;
    const offsetY = (60 - scaledHeight) / 2;
    thumbnailCtx.drawImage(
      sourceCanvas,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    );
    this.thumbnail = thumbnailCanvas.toDataURL(); // Store as data URL
  }
  // Creates a deep clone of the frame and its shapes
  clone() {
    const cloned = new Frame();
    cloned.shapes = this.shapes.map((shape) => shape.clone());
    return cloned;
  }
}
export default Frame;
