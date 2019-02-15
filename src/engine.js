/** Initiates the engine.
 * @class
 * @classdesc An engine made for creating HTML5 apps that work on a canvas and use a main loop.
 */
class Engine {
   /** Initializes the engine.
   * @param {Object} config - Contains parameters required to initiate the engine.
   *  @param {String} [config.root="/"] - The root of the engine source files (engine.js should be in this diirectory).
   *  @param {Array} [config.loadModules=[]] - A list of modules to load at launch.
   *  @param {Array} [config.loadScripts=[]] - A list of scripts to load right after the modules. These are generally all the scripts needed to run the game.
   *  @param {function} [config.onReady=function() {}]
   *  @param {int} [config.updateFrequency=60] - The number of updates in one second.
   *  @param {int} [config.width=1280] - The internal width of the game, in pixels.
   *  @param {int} [config.height=720] - The internal height of the game, in pixels.
   *  @param {DOM Element} [config.viewport=body] - The viewport in which the canvas will be added and resized accordingly.
   *  @param {string} [config.documentTitle] - The title of the document (shows up in the browser tab).
   */
   static init(config) {
      /** Default configuration */
      Engine.DEFAULT_CONFIG = {
         // Used here and discarded
         viewport: document.getElementsByTagName("body")[0],
         onReady: () => {},
         loadModules: [],
         loadScripts: [],

         // Direct properties of Engine
         root: "/",
         width: 1280,
         height: 720,

         // Saved to Engine.config
         documentTitle: null,
         disableContextMenu: true,
         autoScaling: true,
         globalRender: (ctx) => {},
         updateFrequency: 60,
      };

      // Process config
      for(let key in Engine.DEFAULT_CONFIG)
         config[key] = config.hasOwnProperty(key) ? config[key] : Engine.DEFAULT_CONFIG[key];

      /** The current version of the engine. */
      Engine.version = "0.3.0";

      /** The root of the module files. */
      Engine.root = config.hasOwnProperty("root") ? config.root : "/";

      /** Counts the number of updates. */
      Engine.tick = 0;

      /** Current event listeners. */
      Engine.eventListeners = [];

      /** Current state */
      Engine.state = null;

      /** Stores the keys that are pressed by keycode for easy access. */
      Engine.keysPressed = {};

      /** Stores mouse data.
      * @property {number} x - The x position, relative to the game.
      * @property {number} y - The y position, relative to the game.
      * @property {number} canvasX - The b position, relative to the canvas.
      * @property {number} canvasY - The y position, relative to the canvas.
      * @property {Object} pressed - Whether or not each mouse button is being pressed. Example: {0: true, 1: false, 2: false}.
      */
      Engine.mouse = {x: 0, y: 0, canvasX: 0, canvasY: 0, pressed: {}};

      // Copy useful config properties
      Engine.width = config.width;
      Engine.height = config.height;
      Engine.config = {
         updateFrequency: config.updateFrequency,
         autoScaling: config.autoScaling,
         disableContextMenu: config.disableContextMenu,
         documentTitle: config.documentTitle,
         globalRender: config.globalRender
      };
      Engine.updateInterval = 1000 / config.updateFrequency; // The interval between two frames, in milliseconds.

      // Set page title
      if(Engine.config.documentTitle)
         document.title = Engine.config.documentTitle;

      const DEPENDENCIES = [
         Engine.root + "modules.js",
         Engine.root + "viewport.js",
         Engine.root + "event-router.js",
         Engine.root + "state.js",
         Engine.root + "event-listener.js",
         Engine.root + "utils.js"
      ];

      let onReady = () => {
         Engine.viewport = new Engine.Viewport(config.viewport);
         Engine.viewport.setAutoScaling(Engine.config.autoScaling);
         Engine.viewport.refreshScaling();
         if(Engine.config.disableContextMenu)
            Engine.viewport.disableContextMenu();

         // Register the events that will be redirected to event listeners
         Engine.EventRouter.setupEventListeners(Engine.viewport.container)

         config.onReady();

         Engine._startLoop();
      };

      // Load required modules and scripts
      let modulesToLoad = config.loadModules;
      let scriptsToLoad = config.loadScripts;
      Engine.ScriptLoader.load(DEPENDENCIES, () => {
         Engine.Modules.loadModules(modulesToLoad, () => {
            Engine.ScriptLoader.loadOrdered(scriptsToLoad, onReady);
         });
      });
   }

   /** Starts the main loop of the game. */
   static _startLoop() {
      if(Engine.tick == 0)
         Engine._tick(Date.now(), 0);
   }

   /** Performs one tick of the game */
   static _tick(lastTime, delta) {
      let currentTime = Date.now();

      // Elapsed milliseconds since last refresh (max of 1 second to avoid huge deltas when requestAnimationFrame is put in background)
      delta += Math.min(1000, currentTime - lastTime);

      // Use a while loop to catch up missed frames
      while(delta >= Engine.updateInterval) {
         Engine._update(Engine.updateInterval * 1e3);
         delta -= Engine.updateInterval;
      }

      Engine._render();

      requestAnimationFrame(() => {
         Engine._tick(currentTime, delta);
      });
   }

   /** Main update function. */
   static _update(dt) {
      if(Engine.state)
         Engine.state.update(dt);

      Engine.tick++;

      Engine.viewport.hasScalingChanged = false; // reset
   }

   /** Main rendering function. */
   static _render() {
      let ctx = Engine.viewport.ctx;
      ctx.save();

      Engine.viewport.applyScaling(ctx);

      if(Engine.state)
         Engine.state.render(ctx);
      Engine.config.globalRender(ctx);

      ctx.restore();

      if(Engine.Modules.isLoaded("debug") && Engine.debug.enabled)
         Engine.debug.render(ctx);
   }

   /** Adds an event listener.
   * @param {EventListener} eventListener - The event listener to add.
   */
   static addEventListener(eventListener) {
      Engine.eventListeners.push(eventListener);
   }

   /** Removes a given event listener.
   * @param {EventListener} eventListener - The event listener to remove.
   */
   static removeEventListener(eventListener) {
     let idx = Engine.eventListeners.indexOf(eventListener);
     if(idx != -1)
         Engine.eventListeners.splice(idx, 1);
   }

   /** Sets the current state of the game.
   * @param {Object} state - The new state value.
   */
   static setState(state) {
      if(Engine.state) {
           Engine.state.onLeave();
           Engine.removeEventListener(Engine.state.eventListener);
      }

      state.onEnter(Engine.state);
      Engine.state = state;
      Engine.addEventListener(Engine.state.eventListener);
   }
};

Engine.ScriptLoader = class ScriptLoader {
   /** Orderless loading
   *
   */
   static load(srcs, onLoad) {
      srcs = Array.isArray(srcs) ? srcs : [srcs];
      let head = document.getElementsByTagName("head")[0];
      let remaining = srcs.length;

      function onScriptLoaded() {
         if(--remaining == 0 && onLoad)
            onLoad();
      }

      for(let i = 0; i < srcs.length; i++) {
         let scriptTag = document.createElement("script");
         head.appendChild(scriptTag);

         scriptTag.onload = onScriptLoaded;
         scriptTag.src = srcs[i];
      }
   }

   /** Ordered loading
   *
   */
   static loadOrdered(srcs, onFinished) {
      if(srcs.length == 0) {
         onFinished();
         return;
      }

      function loadNextScript(idx) {
         Engine.ScriptLoader.load(srcs[idx], function() {
            if(idx == srcs.length-1)
               onFinished();
            else
               loadNextScript(idx+1);
         });
      }
      loadNextScript(0);
   }
}
