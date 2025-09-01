import Shape from "./Shape.js";
// Represents an image shape
class ImageShape extends Shape {
  constructor(x, y, width, height, imageData) {
    super();
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 100;
    this.height = height || 100;
    this.imageData = imageData || "";
    this.image = new Image();
    if (imageData) {
      this.image.src = imageData;
    }
  }
  // Draws the image if it's loaded
  drawShape(ctx) {
    if (this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }
  // Gets the bounding box of the image
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  get supportsPixelErasing() {
    return true;
  }

  // Checks if a point is contained within the image's bounding box
  containsPoint(point) {
    return (
      point.x >= this.x &&
      point.x <= this.x + this.width &&
      point.y >= this.y &&
      point.y <= this.y + this.height
    );
  }

  clone() {
    const img = new ImageShape();
    img.x = this.x + 10;
    img.y = this.y;
    img.width = this.width;
    img.height = this.height;
    img.image = this.image;
    img.src = this.src;
    img.transform = this.transform ? this.transform.clone() : null;
    img.visible = this.visible;
    // ...copy any other relevant properties...
    return img;
  }
}
export default ImageShape;
