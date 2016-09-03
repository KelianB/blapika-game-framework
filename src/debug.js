/*
    global Engine
*/

/** @class
 * @classdesc An utility class which handles the display of debugging info.
 */
Engine.prototype.Debug = new function() {
    /** The code of the key that toggles the debug. */
    this.toggleKey = 101;
    
    /** Whether or not the debug mode is enabled. */
    this.enabled = true;
    
    /** The lines that are displayed on the debug menu. */
    this.lines = [];
    
    /** The style of the debug menu.
     * @property {int} fontSize=14
     * @property {int} lineHeight=16
     * @property {string} font=Consolas
     * @property {string} color=rgb(255,255,255)
     * @property {string} backgroundColor=rgba(40,40,40,0.7)
     * @property {number} x=0
     * @property {number} y=0
     * @property {number} padding=6
     */
    this.debugStyle = {
        fontSize: 14,
        lineHeight: 16,
        font: "Consolas",
        color: "rgb(255, 255, 255)",
        backgroundColor: "rgba(40, 40, 40, 0.7)",
        x: 0,
        y: 0,
        padding: 6
    };
    
    /** Adds a line to the rendered debug info.
     * @param {string} name - The value's name.
     * @param {string} value - The value.
     */ 
    this.addLine = function(name, value, expectations) {
        this.lines.push({name: name, value: value, expectations: expectations});
    };
    
    /** Renders the debug menu.
     * @param {CanvasRenderingContext2D} ctx - The rendering context on which to draw the debug menu.
     */ 
    this.render = function(ctx) {
        if(!this.enabled || this.lines.length == 0)
            return;
        
        ctx.textBaseline = "hanging"; 
        ctx.font = this.debugStyle.fontSize + "px " + this.debugStyle.font;
        
        // Calculate max width
        var maxWidthName = 0, maxWidthValue = 0;
        for(var i = 0; i < this.lines.length; i++) {
            var nameLen = ctx.measureText(this.lines[i].name).width;
            if(nameLen > maxWidthName)
                maxWidthName = nameLen;

            var valueLen = ctx.measureText(this.lines[i].value).width;
            if(valueLen > maxWidthValue)
                maxWidthValue = valueLen;
        }
        
        // Calculate dimensions
        var width =  2 * this.debugStyle.padding + maxWidthValue + maxWidthName + ctx.measureText(" : ").width,
            height = 2 * this.debugStyle.padding + this.lines.length * this.debugStyle.lineHeight - (this.debugStyle.lineHeight - this.debugStyle.fontSize);
            
        // Draw background
        ctx.fillStyle = this.debugStyle.backgroundColor;
        ctx.fillRect(this.debugStyle.x, this.debugStyle.y, width, height);
        
        ctx.textAlign = "left";
        
        var totalNameLength = Math.floor(maxWidthName / ctx.measureText(" ").width);
        
        // Draw lines
        for(var i = 0; i < this.lines.length; i++) {
            var l = this.lines[i];
            ctx.fillStyle = this.debugStyle.color;
            
            if(l.expectations) {
                if((l.expectations.boolean  != undefined && l.expectations.boolean != l.value) ||
                   (l.expectations.maxValue != undefined && l.value > l.expectations.maxValue) ||
                   (l.expectations.minValue != undefined && l.value < l.expectations.minValue)) {
                    ctx.fillStyle = "rgb(220, 100, 80)";
                }
            }

            var str = l.name + (" ").repeat(totalNameLength - l.name.length) + " : " + l.value;
            ctx.fillText(str, this.debugStyle.x + this.debugStyle.padding, this.debugStyle.y + this.debugStyle.padding + i * this.debugStyle.lineHeight);
        }
        
        this.lines = [];
    };
    
    /** Sets the key used to toggle the debug menu.
     * @param {int} key - The keyCode of the toggling key.
     */
    this.setToggleKey = function(key) {
        this.toggleKey = key;
    };
};