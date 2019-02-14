
Engine.ModuleManager = class ModuleManager {
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
            if(Engine.MODULE_NAMES.indexOf(m) == -1 || Engine.ModuleManager.isModuleLoaded(m))
               toLoad--;
            else {
               Engine.ModuleManager.loadModule(m, () => {
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
      Engine.ModuleManager.loadModules(Engine.MODULE_NAMES, callback);
   }

   /** Checks if a given module is loaded.
   * @param {String} moduleName - The name of the module to check for.
   * @returns {Boolean} Whether or not the module is loaded.
   */
   static isModuleLoaded(moduleName) {
      return Engine.ModuleManager.loadedModules.indexOf(moduleName) != -1;
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
      else if(Engine.ModuleManager.isModuleLoaded(name)) {
         console.error("Module", name, "is already loaded.")
         return;
      }

      let moduleRoot = Engine.root + "modules/" + name + "/";
      let internalFiles = Engine.MODULES[name].internalFiles;

      function loadModuleFile() {
         Engine.ScriptLoader.load(moduleRoot + name + ".js", () => {
            Engine.ModuleManager.loadedModules.push(name);
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
}

Engine.ModuleManager.loadedModules = [];
