/** Initiates the engine.
 * @class
 * @classdesc Manages modules.
 */
class Engine {
   constructor() {
      Engine.MODULE_NAMES = ["core", "animation", "audio-manager", "resource-manager", "debug", "particle", "camera", "tilemap"];

      /** The current version of the engine. */
      this.version = "0.2.0";

      /** The root of the module files. */
      this.root = "/";

      /** Stores loaded modules. */
      this.loadedModules = [];
   }

   /** Loads the given modules.
   * @param {Array} modules - The name of the modules to load.
   * @param {Function} [callback] - A function that will be called when the modules are done loading.
   */
   loadModules(modules, callback) {
      let toLoad = modules.length;

      for(let i = 0; i < modules.length; i++) {
         let m = modules[i];
         Engine._loadScript(this.root + m + ".js", () => {
            this.loadedModules.push(m);
            if(--toLoad == 0 && callback)
                 callback();
         });
      }
   }

   /** Loads all modules available in this engine.
   * @param {Function} [callback] - A function that will be called when the modules are done loading.
   */
   loadAllModules(callback) {
      this.loadModules(Engine.MODULE_NAMES, callback);
   }

   /** Checks if a given module is loaded.
   * @param {String} moduleName - The name of the module to check for.
   * @returns {Boolean} Whether or not the module is loaded.
   */
   isModuleLoaded(moduleName) {
      return this.loadedModules.indexOf(moduleName) != -1;
   }

   static _loadScript(src, onLoad) {
      let scriptTag = document.createElement("script");
      let head = document.getElementsByTagName("head")[0];
      head.appendChild(scriptTag); // Append the script to the DOM

      scriptTag.onload = onLoad;
      scriptTag.src = src;
   }

   static httpGet(url, callbacks) {
      let httpRequest = new XMLHttpRequest();
      httpRequest.addEventListener("load", function(e) {
         if(e.target.status == 200) {
            if(callbacks.hasOwnProperty("onLoaded"))
               callbacks.onLoaded(e.target.responseText);
         }
         else {
            if(callbacks.hasOwnProperty("onError"))
               callbacks.onError(e.target);
         }
      });
      httpRequest.addEventListener("error", function(e) {
         if(callbacks.hasOwnProperty("onError"))
            callbacks.onError(e.target);
      });
      httpRequest.open("GET", url);
      httpRequest.send();
   }
};

let engine = new Engine();

/** Creates the structure of a state to be used in the game engine.
 * @class
 * @classdesc Represents one possible state for the app. See Game.setState.
*/
engine.State = class State {
   constructor() {
      // Tick elapsed since the state was entered
      this.tick = 0;

      // Create an event listener for this state.
      this.setEventListener(new engine.EventListener());
   }

   /** Renders the state. Note tat the engine handles the scaling for you before calling this function.
   * @param {CanvasRenderingContext2D} ctx - The context on which to render the state.
   */
   render(ctx) {}

   /** Updates the variables required for this state to work.
   *  @param {int} dt - The number of microseconds by which the game should go forward in time.
   */
   update(dt) {}

   /** Fired by the engine when this state is left. */
   onLeave() {}

   /** Fired by the engine when this state is entered.
   * @param {State} previousState - The previous state of the app (null if there is none).
   */
   onEnter(previousState) {}

   /** Sets the event listener of this state.
   * @param {EventListener} eventListener - The event listener.
   */
   setEventListener(eventListener) {
      if(engine.core.state == this) {
         console.error("Cannot change event listener of current state.");
         return;
      }
      this.eventListener = eventListener;
   }
}

/** Creates an event listener.
 * @class
 * @classdesc Utility class that catches event fired by the used.class
 * @param {Object} receivers - Functions that will be called when receiving an event.
 */
engine.EventListener = class EventListener {
   constructor(receivers) {
      // Override listeners
      if(receivers) {
         for(let key in receivers) {
             if(this[key])
                 this[key] = receivers[key];
         }
      }
   }

   /** @param {int} button - The mouse button that was pressed. */
   onMouseDown(button) {}

   /** @param {int} button - The mouse button that was released. */
   onMouseUp(button) {}

   /** @param {Object} mouseData - The mouse data. See Engine.Core.mouse */
   onMouseMove(position) {}

   /** @param {Number} wheelDelta - The scroll amount. */
   onWheel(wheelDelta) {}

   /** @param {int} keyCode - The code of the key that was pressed. See https://goo.gl/qTckww */
   onKeyDown(keyCode) {}

   /** @param {int} keyCode - The code of the key that was released. See https://goo.gl/qTckww */
   onKeyUp(keyCode) {}
};
