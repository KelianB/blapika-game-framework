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
            $.getScript(this.root + m + ".js", () => {
                this.loadedModules.push(m);
                if(--toLoad == 0 && callback)
                    callback();
            });
        }
    };

    /** Loads all modules available in this engine.
     * @param {Function} [callback] - A function that will be called when the modules are done loading.
     */
    loadAllModules(callback) {
        this.loadModules(Engine.MODULE_NAMES, callback);
    };

    /** Checks if a given module is loaded.
     * @param {String} moduleName - The name of the module to check for.
     * @returns {Boolean} Whether or not the module is loaded.
     */
    isModuleLoaded(moduleName) {
        return this.loadedModules.indexOf(moduleName) != -1;
    };
};

let engine = new Engine();
