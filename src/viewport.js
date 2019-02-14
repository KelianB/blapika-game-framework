
Engine.Viewport = class Viewport {
   constructor(container) {
      if(!container)
         console.error("Cannot initialize the Viewport without a container element");

      this.container = container;

      /** A boolean that switches to true for a single tick whenever the renderScaling changes. */
      this.hasScalingChanged = false;

      /** Stores the X and Y scaling used for rendering the game at its appropriate size on the canvas.
      * @property {number} x - The scaling along the x-axis.
      * @property {number} y - The scaling along the y-axis.
      */
      this.renderScaling = {x: 1, y: 1};

      // Create a canvas
      this.canvas =  document.createElement("canvas");
      this.ctx = this.canvas.getContext("2d");

      // Add the canvas to the viewport.
      this.container.append(this.canvas);

      this.autoScaling = true;

      // Call refreshScaling autimatically on resize.
      let resizeTimeout;
      window.addEventListener("resize", () => {
         clearInterval(resizeTimeout);
         resizeTimeout = setTimeout(() => {this.refreshScaling()}, 80);
      });
   }

   disableContextMenu() {
      // Prevents undesired context menus when right-clicking on the canvas
      this.canvas.addEventListener("contextmenu", (e) => {e.preventDefault();});
   }

   /** Resizes the canvas and updates the render scaling. */
   refreshScaling() {
      let vpWidth = this.container.clientWidth;
      let vpHeight = this.container.clientHeight;

      if(!this.autoScaling) {
         this.canvas.width = vpWidth;
         this.canvas.height = vpHeight;

         this.hasScalingChanged = true;

         this.renderScaling = {x: 1, y: 1};
         return;
      }

      let heightToWidthRatio = Engine.height / Engine.width;

      if(heightToWidthRatio > vpHeight / vpWidth) { // Fit height and scale width to keep ratio
           this.canvas.height = vpHeight;
           this.canvas.width = this.canvas.height / heightToWidthRatio;
      }
      else { // Fit width and scale height to keep ratio
           this.canvas.width = vpWidth;
           this.canvas.height = this.canvas.width * heightToWidthRatio;
      }

      this.renderScaling = {
           x: this.canvas.width / Engine.width,
           y: this.canvas.height / Engine.height
      };
      this.hasScalingChanged = true;
   }

   applyScaling(ctx) {
      ctx.scale(this.renderScaling.x, this.renderScaling.y)
   }
   removeScaling(ctx) {
      ctx.scale(1 / this.renderScaling.x, 1 / this.renderScaling.y)
   }

   setAutoScaling(b) {
      this.autoScaling = b;
   }
}
