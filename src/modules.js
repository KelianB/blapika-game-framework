
Engine.MODULES = {
   "animation": {},
   "audio-manager": {},
   "resource-manager": {},
   "debug": {},
   "particle": {
      internalFiles: ["particle-spawner.js"]
   },
   "camera": {},
   "tilemap": {
      internalFiles: ["tile.js", "tileset.js", "map-layer.js"]
   }
};

Engine.Modules = class Modules {
   /** Checks if a given module is loaded.
   * @param {String} moduleName - The name of the module to check for.
   * @returns {Boolean} Whether or not the module is loaded.
   */
   static isLoaded(moduleName) {
      return Engine.Modules.loaded.indexOf(moduleName) != -1;
   }

   /** Loads the given modules.
   * @param {Array} modules - The names of the modules to load.
   * @param {Function} [callback] - A function that will be called when the modules are done loading.
   */
   static loadModules(modules, callback) {
      let toLoad = modules.length;

      if(toLoad == 0)
         callback();
      else {
         for(let i = 0; i < modules.length; i++) {
            let m = modules[i];
            if(Engine.Modules.NAMES.indexOf(m) == -1 || Engine.Modules.isLoaded(m))
               toLoad--;
            else {
               Engine.Modules.loadModule(m, () => {
                  if(--toLoad == 0 && callback)
                       callback();
               });
            }
         }
      }
   }

   /** Loads a single module
   * @param {String} moduleName - The name of the module to load.
   * @returns {function} onLoad - A function that will be called when the module done loading.
   */
   static loadModule(name, onLoad) {
      if(Engine.Modules.NAMES.indexOf(name) == -1) {
         console.error("Module", name, "does not exist.")
         return;
      }
      else if(Engine.Modules.isLoaded(name)) {
         console.error("Module", name, "is already loaded.")
         return;
      }

      let moduleRoot = Engine.root + "modules/" + name + "/";
      let internalFiles = Engine.MODULES[name].internalFiles || [];

      let srcs = [];
      for(let i = 0; i < internalFiles.length; i++)
         srcs.push(moduleRoot + internalFiles[i]);

      // Load dependencies
      Engine.ScriptLoader.loadOrdered(srcs, () => {
         // Load the main file
         Engine.ScriptLoader.load(moduleRoot + name + ".js", () => {
            Engine.Modules.loaded.push(name);
            if(onLoad)
               onLoad();
         });
      });
   }

   /** Loads all modules available in this engine.
   * @param {Function} [callback] - A function that will be called when the modules are done loading.
   */
   static loadAllModules(callback) {
      Engine.Modules.loadModules(Engine.Modules.NAMES, callback);
   }
}

Engine.Modules.loaded = [];
Engine.Modules.NAMES = Object.keys(Engine.MODULES);
