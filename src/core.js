/*
    global $ Engine engine
*/

/** Creates an instance of the engine core.
 * @class
 * @classdesc A framework made for creating HTML5 apps that work on a canvas and use a main loop.
 */
Engine.prototype.Core = new function() {
    var self = this;

    // Default configuration
    var defaultConfig = {
        updateFrequency: 60,
        width: 1280,
        height: 720,
        viewport: $("body"),
        documentTitle: null
    };

    /** Current event listeners. */
    this.eventListeners = [];

    /** Counts the number of updates. */
    this.tick = 0;

    /** Stores mouse data.
     * @property {number} x - The x position, relative to the game.
     * @property {number} y - The y position, relative to the game.
     * @property {number} canvasX - The x position, relative to the canvas.
     * @property {number} canvasY - The y position, relative to the canvas.
     * @property {Object} pressed - Whether or not each mouse button is being pressed. Example: {0: true, 1: false, 2: false}.
     */
    this.mouse = {x: 0, y: 0, canvasX: 0, canvasY: 0, pressed: {}};

    /** Stores the X and Y scaling used for rendering the game at its appropriate size on the canvas.
     * @property {number} x - The scaling along the x-axis.
     * @property {number} y - The scaling along the y-axis.
     */
    this.renderScaling = {x: 1, y: 1};

    /** Initializes the framework.
     * @param {Object} config - Contains all of the parameters required to initiate the framework.
     *  @param {int} [config.updateFrequency=60] - The number of updates in one second.
     *  @param {int} [config.width=1280] - The internal width of the game, in pixels.
     *  @param {int} [config.height=720] - The internal height of the game, in pixels.
     *  @param {jQuery-element} [config.viewport=body] - The viewport in which the canvas will be added and resized accordingly.
     *  @param {string} [config.documentTitle] - The title of the document (shows up in the browser tab).
     */
    this.init = function(config) {
        // Copy values from config to engine.
        for(var key in defaultConfig)
            self[key] = config[key] || defaultConfig[key];

        // Calculate the interval between two frames, in milliseconds.
        self.updateInterval = 1000 / self.updateFrequency;

        // Create a canvas
        self.canvas = $("<canvas>")[0];
        self.canvas.oncontextmenu = function(e){e.preventDefault();}; // prevents annoying context menus when right-clicking on the canvas.
        self.ctx = self.canvas.getContext("2d");

        // Add the canvas to the viewport.
        self.viewport.append(self.canvas);

        // Set page title.
        if(self.documentTitle)
            $("title").text(self.documentTitle);

        // Sets a default empty state.
        self.setState(new engine.State());

        // Register events.
        window.onresize = function() {
            clearInterval(resizeTimeout);
            resizeTimeout = setTimeout(onResize, 80);
        };
        registerEvents();

        onResize();
    };

    var resizeTimeout;

    /** Resizes the canvas and updates the render scaling. */
    var onResize = function() {
        var vpWidth = self.viewport.width(),
            vpHeight = self.viewport.height();

        var heightToWidthRatio = self.height / self.width;

        if(heightToWidthRatio > vpHeight / vpWidth) {
            // Fit height and scale width to keep ratio
            self.canvas.height = vpHeight;
            self.canvas.width = self.canvas.height / heightToWidthRatio;
        }
        else {
            // Fit width and scale height to keep ratio
            self.canvas.width = vpWidth;
            self.canvas.height = self.canvas.width * heightToWidthRatio;
        }

        self.renderScaling = {
            x: self.canvas.width / self.width,
            y: self.canvas.height / self.height
        };
    };

    /** Main update function. */
    var update = function() {
        self.state.update();
        self.state.tick++;
        self.tick++;
    };

    /** Main rendering function. */
    var render = function() {
        self.ctx.save();
        self.ctx.scale(self.renderScaling.x, self.renderScaling.y)

        self.state.render(self.ctx);

        self.ctx.restore();

        if(engine.isModuleLoaded("debug") && engine.Debug.enabled)
            engine.Debug.render(self.ctx);
    };

    /** Registers the events that will be re-directed the the event listeners. */
    var registerEvents = function() {
        self.viewport.mousedown(function(e) {
            self.mouse.pressed[e.which] = true;
            for(var i = 0; i < self.eventListeners.length; i++)
                self.eventListeners[i].onMouseDown(e.which);
        });
        self.viewport.mouseup(function(e) {
            self.mouse.pressed[e.which] = false;
            for(var i = 0; i < self.eventListeners.length; i++)
                self.eventListeners[i].onMouseUp(e.which);
        });
        self.viewport.mousemove(function(e) {
            var rect = self.canvas.getBoundingClientRect();
			self.mouse.canvasX = (e.clientX || e.pageX) - rect.left;
			self.mouse.canvasY = (e.clientY || e.pageY) - rect.top;
			self.mouse.x = (self.mouse.canvasX / self.canvas.width) * self.width;
			self.mouse.y = (self.mouse.canvasY / self.canvas.height) * self.height;
			for(var i = 0; i < self.eventListeners.length; i++)
                self.eventListeners[i].onMouseMove(self.mouse);
        });

        self.viewport[0].addEventListener("wheel", function(e) {
            for(var i = 0; i < self.eventListeners.length; i++)
                self.eventListeners[i].onWheel(e.wheelDelta);
        });

        self.viewport.keydown(function(e) {
            for(var i = 0; i < self.eventListeners.length; i++)
                self.eventListeners[i].onKeyDown(e.keyCode);
        });

        self.viewport.keyup(function(e) {
            for(var i = 0; i < self.eventListeners.length; i++)
                self.eventListeners[i].onKeyUp(e.keyCode);
        });
    };

    /** Adds an event listener.
     * @param {EventListener} eventListener - The event listener to add.
     */
    this.addEventListener = function(eventListener) {
        this.eventListeners.push(eventListener);
    };

    /** Removes a given event listener.
     * @param {EventListener} eventListener - The event listener to remove.
     */
    this.removeEventListener = function(eventListener) {
        var idx = this.eventListeners.indexOf(eventListener);
        if(idx != -1)
            this.eventListeners.splice(idx, 1);
    };

    /** Starts the main loop of the game. */
    this.startLoop = function() {
        var loop = function(lastTime, delta) {
    	    var currentTime = Date.now();

    	    // Elapsed milliseconds since last refresh (max of 1 second to avoid huge deltas when requestAnimationFrame is put in background)
    	    delta += Math.min(1000, currentTime - lastTime);
    	    // Use a while loop to catch up missed frames
    	    while(delta >= self.updateInterval) {
    	        update();
    	        delta -= self.updateInterval;
    	    }

    	    render();

    	    var lastTime = currentTime;
    	    requestAnimationFrame(function() {
    	        loop(currentTime, delta);
    	    });
        };

        loop(Date.now(), 0);
    };

    /** Sets the state of the game.
     * @param {Object} state - The new state value.
    */
    this.setState = function(state) {
        if(this.state) {
            this.state.onLeave();
            this.removeEventListener(this.state.eventListener);
        }

        state.onEnter();
        self.state = state;
        this.addEventListener(this.state.eventListener);
    };
}

/** Creates the structure of a state to be used in the game engine.
 * @class
 * @classdesc Represents one possible state for the app. See Game.setState.
*/
Engine.prototype.State = function() {
    // Tick elapsed since the state was entered
    this.tick = 0;

    /** Renders the state. Note tat the engine handles the scaling for you before calling this function.
     * @param {CanvasRenderingContext2D} ctx - The context on which to render the state.
    */
    this.render = function(ctx) {};

    /** Updates the variables required for this state to work. */
    this.update = function() {};

    /** Fired by the engine when this state is left. */
    this.onLeave = function() {};

    /** Fired by the engine when this state is entered. */
    this.onEnter = function() {};

    /** Sets the event listener of this state.
     * @param {EventListener} eventListener - The event listener.
     */
    this.setEventListener = function(eventListener) {
        if(engine.Core.state == this) {
            console.error("Cannot change event listener of current state.");
            return;
        }
        this.eventListener = eventListener;
    };

    // Create an event listener for this state.
    this.setEventListener(new engine.EventListener());
}

/** Creates an event listener.
 * @class
 * @classdesc Utility class that catches event fired by the used.class
 * @param {Object} receivers - Functions that will be called when receiving an event.
 */
Engine.prototype.EventListener = function(receivers) {
    /** @param {int} button - The mouse button that was pressed. */
    this.onMouseDown = function(button) {};

    /** @param {int} button - The mouse button that was released. */
    this.onMouseUp = function(button) {};

    /** @param {Object} mouseData - The mouse data. See Engine.Core.mouse */
    this.onMouseMove = function(position) {};

    /** @param {Number} wheelDelta - The scroll amount. */
    this.onWheel = function(wheelDelta) {};

    /** @param {int} keyCode - The code of the key that was pressed. See https://goo.gl/qTckww */
    this.onKeyDown = function(keyCode) {};

    /** @param {int} keyCode - The code of the key that was released. See https://goo.gl/qTckww */
    this.onKeyUp = function(keyCode) {};

    // Override listeners
    for(var key in receivers) {
        if(this[key])
            this[key] = receivers[key];
    }
};
