/*
    global Engine
*/

/** Creates an animation.
 * @class
 * @classdesc Utility class that handles animations from a list of images
 * @param {Array} images - An array of Image objects.
 * @param {(int|Array)} delays - An array or a constant defining the number of frames between two images.
 */ 
Engine.prototype.Animation = function(images, delays) {
    this.images = images;
    this.delays = delays;
    this.index = 0;
    
    // If the delay parameter is a constant, put it in an array 
    if(Number.isInteger(delays)) {
        this.delays = [];
        for(var i = 0; i < images.length; i++)
            this.delays[i] = delays;
    }
    
    /** Updates the animation. Has to be called on each engine tick. */
    this.update = function() {
        this.toNextFrame--;

        if(this.toNextFrame == 0) {
            this.index = (this.index + 1) % this.images.length;
            this.toNextFrame = this.delays[this.index];
        }
    };
    
    /** Returns the current image of this animation.
     * @returns {Image} - The current image.
     */
    this.getCurrentImage = function() {
        return this.images[this.index]; 
    }; 
    
    /** Renders the animation
     * @param {CanvasRenderingContext2D} ctx - The rendering context on which to draw the image.
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    this.render = function(ctx, x, y, width, height) {
        ctx.drawImage(this.getCurrentImage(), x, y, width, height);    
    };
}