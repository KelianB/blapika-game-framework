/*
    global $ Engine engine
*/

/** Creates an instance of the engine core.
 * @class
 * @classdesc A framework made for creating HTML5 apps that work on a canvas and use a main loop.
 */
engine.Core = class Core {
    constructor() {

        // Define default configuration
        Core.DEFAULT_CONFIG = {
            updateFrequency: 60,
            width: 1280,
            height: 720,
            viewport: $("body"),
            documentTitle: null,
            disableContextMenu: true,
            disableAutoScaling: false,
            globalRender: (ctx) => {}
        };

        /** Current event listeners. */
        this.eventListeners = [];

        /** Counts the number of updates. */
        this.tick = 0;

        /** Stores the keys that are pressed by keycode for easy access. */
        this.keysPressed = {};

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

        /** A boolean that switches to true for a single tick whenever the renderScaling changes. */
        this.hasScalingChanged = false;
    }

    // This is used to fix weird lines appearing on the canvas on firefox
    static bitwiseRound(value) {
        // ~~ is a double NOT bitwise operator, which acts as a substitute for Math.floor
        return ~~(value + 0.5);
    };

    /** Initializes the framework.
     * @param {Object} config - Contains all of the parameters required to initiate the framework.
     *  @param {int} [config.updateFrequency=60] - The number of updates in one second.
     *  @param {int} [config.width=1280] - The internal width of the game, in pixels.
     *  @param {int} [config.height=720] - The internal height of the game, in pixels.
     *  @param {jQuery-element} [config.viewport=body] - The viewport in which the canvas will be added and resized accordingly.
     *  @param {string} [config.documentTitle] - The title of the document (shows up in the browser tab).
     */
    init(config) {
        // Copy values from config to engine.
        for(let key in Core.DEFAULT_CONFIG)
            this[key] = config[key] || Core.DEFAULT_CONFIG[key];

        // Calculate the interval between two frames, in milliseconds.
        this.updateInterval = 1000 / this.updateFrequency;

        // Create a canvas
        this.canvas = $("<canvas>")[0];
        this.ctx = this.canvas.getContext("2d");

        if(this.disableContextMenu)
            this.canvas.oncontextmenu = function(e){e.preventDefault();}; // prevents annoying context menus when right-clicking on the canvas.


        // Add the canvas to the viewport.
        this.viewport.append(this.canvas);

        // Set page title.
        if(this.documentTitle)
            $("title").text(this.documentTitle);

        // Sets a default empty state.
        this.setState(new engine.State());

        let resizeTimeout;
        window.onresize = () => {
            clearInterval(resizeTimeout);
            resizeTimeout = setTimeout(this._onResize, 80);
        };

        // Register the events that will be re-dericted to event listeners.
        this.viewport.mousedown((e) => {
            this.mouse.pressed[e.which] = true;
            for(let i = 0; i < this.eventListeners.length; i++)
                this.eventListeners[i].onMouseDown(e.which);
        });
        this.viewport.mouseup((e) => {
            this.mouse.pressed[e.which] = false;
            for(let i = 0; i < this.eventListeners.length; i++)
                this.eventListeners[i].onMouseUp(e.which);
        });
        this.viewport.mousemove((e) => {
            var rect = this.canvas.getBoundingClientRect();
            var previousPos = {x: this.mouse.x, y: this.mouse.y};
			this.mouse.canvasX = (e.clientX || e.pageX) - rect.left;
			this.mouse.canvasY = (e.clientY || e.pageY) - rect.top;
			this.mouse.x = this.mouse.canvasX / this.renderScaling.x;
			this.mouse.y = this.mouse.canvasY / this.renderScaling.y;
			for(let i = 0; i < this.eventListeners.length; i++)
                this.eventListeners[i].onMouseMove(this.mouse, previousPos, e);
        });
        this.viewport[0].addEventListener("wheel", (e) => {
            let wheelDelta = e.wheelDelta ? e.deltaY : "firefox sucks";
            if(wheelDelta == "firefox sucks")
                wheelDelta = e.deltaY * (100 / 3); // normalize delta on firefox
            for(let i = 0; i < this.eventListeners.length; i++)
                this.eventListeners[i].onWheel(wheelDelta);
        });
        this.viewport.keydown((e) => {
            for(let i = 0; i < this.eventListeners.length; i++)
                this.eventListeners[i].onKeyDown(e.keyCode);
            this.keysPressed[e.keyCode] = true;
        });
        this.viewport.keyup((e) => {
            for(let i = 0; i < this.eventListeners.length; i++)
                this.eventListeners[i].onKeyUp(e.keyCode);
            this.keysPressed[e.keyCode] = false;
        });

        this._onResize();
    };

    applyScaling(ctx) {
        ctx.scale(this.renderScaling.x, this.renderScaling.y)
    };
    removeScaling(ctx) {
        ctx.scale(1 / this.renderScaling.x, 1 / this.renderScaling.y)
    };

    /** Adds an event listener.
     * @param {EventListener} eventListener - The event listener to add.
     */
    addEventListener(eventListener) {
        this.eventListeners.push(eventListener);
    };

    /** Removes a given event listener.
     * @param {EventListener} eventListener - The event listener to remove.
     */
    removeEventListener(eventListener) {
        let idx = this.eventListeners.indexOf(eventListener);
        if(idx != -1)
            this.eventListeners.splice(idx, 1);
    };

    /** Starts the main loop of the game. */
    startLoop() {
        this._tick(Date.now(), 0);
    };

    /** Sets the state of the game.
     * @param {Object} state - The new state value.
    */
    setState(state) {
        if(this.state) {
            this.state.onLeave();
            this.removeEventListener(this.state.eventListener);
        }

        state.onEnter(this.state);
        this.state = state;
        this.addEventListener(this.state.eventListener);
    };

    _tick(lastTime, delta) {
        let currentTime = Date.now();

        // Elapsed milliseconds since last refresh (max of 1 second to avoid huge deltas when requestAnimationFrame is put in background)
        delta += Math.min(1000, currentTime - lastTime);

        // Use a while loop to catch up missed frames
        while(delta >= this.updateInterval) {
            this._update();
            delta -= this.updateInterval;
        }

        this._render();

        requestAnimationFrame(() => {
            this._tick(currentTime, delta);
        });
    }

    /** Resizes the canvas and updates the render scaling. */
    _onResize() {
        var vpWidth = this.viewport.width(),
            vpHeight = this.viewport.height();

        if(this.disableAutoScaling) {
            this.canvas.height = vpHeight;
            this.canvas.width = vpWidth;
            this.hasScalingChanged = true;

            this.renderScaling = {
                x: 1,
                y: 1
            };
            return;
        }

        let heightToWidthRatio = this.height / this.width;

        if(heightToWidthRatio > vpHeight / vpWidth) {
            // Fit height and scale width to keep ratio
            this.canvas.height = vpHeight;
            this.canvas.width = this.canvas.height / heightToWidthRatio;
        }
        else {
            // Fit width and scale height to keep ratio
            this.canvas.width = vpWidth;
            this.canvas.height = this.canvas.width * heightToWidthRatio;
        }

        this.renderScaling = {
            x: this.canvas.width / this.width,
            y: this.canvas.height / this.height
        };
        this.hasScalingChanged = true;
    };

    /** Main update function. */
    _update() {
        this.state.update();
        this.state.tick++;
        this.tick++;

        this.hasScalingChanged = false; // reset
    };

    /** Main rendering function. */
    _render() {
        this.ctx.save();
        this.applyScaling(this.ctx);

        this.state.render(this.ctx);
        this.globalRender(this.ctx);

        this.ctx.restore();

        if(engine.isModuleLoaded("debug") && engine.debug.enabled)
            engine.debug.render(this.ctx);
    };
}

engine.core = new engine.Core();
