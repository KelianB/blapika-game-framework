/** Initiates the engine.
 * @class
 * @classdesc Manages modules.
 */
class Engine {
   static init(cfg) {
      Engine.MODULES = {
         "core": {
            internalFiles: ["state.js", "event-listener.js"]
         },
         "animation": {},
         "audio-manager": {},
         "resource-manager": {},
         "debug": {},
         "particle": {
            internalFiles: ["particle-spawner.js"]
         },
         "camera": {},
         "tilemap": {}
      };
      Engine.MODULE_NAMES = Object.keys(Engine.MODULES);

      /** The current version of the engine. */
      Engine.version = "0.3.0";

      /** Stores loaded modules. */
      Engine.loadedModules = [];

      /** The root of the module files. */
      Engine.root = cfg.hasOwnProperty("root") ? cfg.root : "/";

      // Load required modules and scripts
      let onReady = cfg.hasOwnProperty("onReady") ? cfg.onReady : () => {};
      let modulesToLoad = cfg.hasOwnProperty("loadModules") ? cfg.loadModules : [];
      let scriptsToLoad = cfg.hasOwnProperty("loadScripts") ? cfg.loadScripts : [];
      Engine.loadModules(modulesToLoad, () => {
         Engine.ScriptLoader.loadOrdered(scriptsToLoad, onReady);
      });
   }

   /** Loads the given modules.
   * @param {Array} modules - The name of the modules to load.
   * @param {Function} [callback] - A function that will be called when the modules are done loading.
   */
   static loadModules(modules, callback) {
      let toLoad = modules.length;

      if(toLoad == 0)
         callback();
      else {
         for(let i = 0; i < modules.length; i++) {
            let m = modules[i];
            if(Engine.MODULE_NAMES.indexOf(m) == -1 || Engine.isModuleLoaded(m))
               toLoad--;
            else {
               Engine.loadModule(m, () => {
                  if(--toLoad == 0 && callback)
                       callback();
               });
            }
         }
      }
   }

   /** Loads all modules available in this engine.
   * @param {Function} [callback] - A function that will be called when the modules are done loading.
   */
   static loadAllModules(callback) {
      Engine.loadModules(Engine.MODULE_NAMES, callback);
   }

   /** Checks if a given module is loaded.
   * @param {String} moduleName - The name of the module to check for.
   * @returns {Boolean} Whether or not the module is loaded.
   */
   static isModuleLoaded(moduleName) {
      return Engine.loadedModules.indexOf(moduleName) != -1;
   }

   /** Loads a single module
   * @param {String} moduleName - The name of the module to load.
   * @returns {function} onLoad - A function that will be called when the module done loading.
   */
   static loadModule(name, onLoad) {
      if(Engine.MODULE_NAMES.indexOf(name) == -1) {
         console.error("Module", name, "does not exist.")
         return;
      }
      else if(Engine.isModuleLoaded(name)) {
         console.error("Module", name, "is already loaded.")
         return;
      }

      let moduleRoot = Engine.root + "modules/" + name + "/";
      let internalFiles = Engine.MODULES[name].internalFiles;

      function loadModuleFile() {
         Engine.ScriptLoader.loadScript(moduleRoot + name + ".js", () => {
            Engine.loadedModules.push(name);
            if(onLoad)
               onLoad();
         });
      }

      if(!internalFiles || internalFiles.length == 0)
         loadModuleFile();
      else {
         let srcs = [];
         for(let i = 0; i < internalFiles.length; i++)
            srcs.push(moduleRoot + internalFiles[i]);

         // Load dependencies and then the main file
         Engine.ScriptLoader.loadOrdered(srcs, () => {loadModuleFile();});
      }
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

Engine.ScriptLoader = class ScriptLoader {
   static loadScript(src, onLoad) {
      let scriptTag = document.createElement("script");
      let head = document.getElementsByTagName("head")[0];
      head.appendChild(scriptTag); // Append the script to the DOM

      scriptTag.onload = onLoad;
      scriptTag.src = src;
   }

   static loadOrdered(srcs, onFinished) {
      if(!srcs || srcs.length == 0) {
         onFinished();
         return;
      }

      function loadNextScript(idx) {
         Engine.ScriptLoader.loadScript(srcs[idx], function() {
            if(idx == srcs.length-1)
               onFinished();
            else
               loadNextScript(idx+1);
         });
      }
      loadNextScript(0);
   }
}
