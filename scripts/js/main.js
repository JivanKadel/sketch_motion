import Point from "./core/Point.js";
import EventHandler from "./EventHandler.js";
import UISetup from "./UISetup.js";
import ShapeManager from "./ShapeManager.js";
import AnimationManager from "./AnimationManager.js";
import Renderer from "./Renderer.js";
import SelectionTransformer from "./SelectionTransformer.js";
import showExportBackgroundDialog from "./helpers/exportformat.js";
import { showMessageBox } from "./helpers/messagebox.js";

// Main application class for the sketching and animation app
export default class SketchingApp {
  constructor() {
    this.canvas = document.getElementById("mainCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.currentTool = "select";
    this.isDrawing = false;
    this.currentShape = null;
    this.selectedShapes = [];
    this.selectionTransformer = new SelectionTransformer(this);
    this.frames = [new AnimationManager.Frame()];
    this.currentFrameIndex = 0;
    this.animationPlaying = false;
    this.animationFrame = null;
    this.lastAnimationTime = 0;
    this.fps = 12;
    this.clipboard = null;
    this.propertiesPanelManuallyHidden = false; // Track if user manually hid panel
    this.viewport = {
      x: 0,
      y: 0,
      zoom: 1,
    };
    this.lastMousePos = new Point(0, 0);
    this.isDragging = false;
    this.dragStart = new Point(0, 0);

    this.eventHandler = new EventHandler(this);
    this.uiSetup = new UISetup(this);
    this.shapeManager = new ShapeManager(this);
    this.animationManager = new AnimationManager(this);
    this.renderer = new Renderer(this);

    this.onionSkinEnabled = false;
    this.eventHandler.setupEventListeners();
    this.uiSetup.setupUI();
    this.renderer.render();
    this.animationManager.updateFramesPanel();
  }

  // Methods from other classes
  // For easy method calls from html file
  addFrame() {
    this.animationManager.addFrame();
  }
  toggleAnimation() {
    this.animationManager.toggleAnimation();
  }

  setTool(tool) {
    this.shapeManager.setTool(tool);
  }

  clearSelection() {
    this.selectedShapes = [];
    this.selectionTransformer.hideSelectionHandles();
    this.renderer.render();
  }

  getMousePos(e) {
    return this.eventHandler.getMousePos(e);
  }

  resetZoom() {
    this.renderer.resetZoom();
  }

  getCurrentFrame() {
    return this.animationManager.getCurrentFrame();
  }

  exportFrame(format) {
    if (format === "svg") {
      showMessageBox(
        "SVG export functionality needs to be implemented with SVG serialization."
      );
      return;
    }
    showExportBackgroundDialog().then(({ bg, cancelled }) => {
      if (!cancelled) {
        // Export using bg ('transparent' or 'white')
        this.renderer.exportFrame(format, bg);
      }
    });
  }

  exportAnimation() {
    this.renderer.exportAnimation();
  }
}
