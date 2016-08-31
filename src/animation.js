/*
    global Engine
*/

/** Creates an animation.
 * @class
 * @classdesc Utility class that handles animations from a list of images
 * @param {Image} image - The sprite that will contain every frame of the animation.
 * @param {(int|Array)} delays - An array or a constant defining the number of frames between two images.
 */ 
Engine.prototype.Animation = function(image, numSprites, delays) {
    this.image = image;
    this.delays = delays;
    
    // Index of the current frame
    this.index = 0;
    
    // Stores a function that gets called when the playCount reaches 0
    this.onDonePlaying = null;
    
    // Whether or not the animation is playing
    this.frozen = false;
    
    // Whether or not the animation is reversed
    this.reverse = false;
    
    // The number of times to play the animation
    this.playCount = 100;
    
    // If the delay parameter is a constant, put it in an array 
    if(Number.isInteger(delays)) {
        this.delays = [];
        for(var i = 0; i < numSprites; i++)
            this.delays[i] = delays;
    }
    
    // The number of ticks before the next frame
    this.toNextFrame = this.delays[0];
    
    /** Updates the animation. Has to be called on each engine tick. */
    this.update = function() {
        if(this.frozen)
            return;
        
        this.toNextFrame--;
        
        if(this.toNextFrame == 0) {
            // Move to the next frame
            var nextIndex = this.index + (this.reverse ? -1 : 1);
            
            // Start the animation again if we're at the end
            if(this.reverse) {
                if(nextIndex < 0)
                    nextIndex = numSprites - 1;
            }
            else if(nextIndex > numSprites - 1)
               nextIndex = 0;

            this.toNextFrame = this.delays[nextIndex];
            
            if(this.playCount != -1) {
                // If we've reached the last frame of the animation
                if((!this.reverse && nextIndex == 0) || (this.reverse && nextIndex == numSprites - 1)) {
                    if(--this.playCount == 0) {
                        this.frozen = true;
                        if(this.onDonePlaying) {
                            this.onDonePlaying();
                            this.onDonePlaying = null;
                        }                    
                    }
                    return;
                }
            }
            this.index = nextIndex;
        }
    };
    
    /** Pauses the animation. 
     * @param {Integer} [frameIndex] - The frame on which to pause the animation (if not specified, freezes the animation at its current frame).
     */
    this.pause = function(frameIndex) {
        if(typeof frameIndex !== "undefined")
            this.index = frameIndex;
        this.toNextFrame = this.delays[this.index];
        this.frozen = true;
    };
    
    /** Plays the animation.
     * @param {Integer} [playCount=1] - The amount of times the animation will play.
     * @param {Function} [onDonePlaying] - A function that will be called when the animation stops playing (when the playCount reaches 0).
     * @param {Boolean} [reverse=false] - Whether or not the animation should play in reverse.
     */ 
    this.play = function(playCount, onDonePlaying, reverse) {
        this.playCount = playCount || 1;
        this.reverse = reverse || this.reverse;
        this.onDonePlaying = onDonePlaying;
        this.frozen = false;
    };
    
    /** Renders the animation
     * @param {CanvasRenderingContext2D} ctx - The rendering context on which to draw the image.
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    this.render = function(ctx, x, y, width, height) {
        var frameWidth = this.image.width / numSprites;
        ctx.drawImage(this.image, 
                        frameWidth * this.index, 0, frameWidth, this.image.height,
                        x, y, width, height);    
    };
}