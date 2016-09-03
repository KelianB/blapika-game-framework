/** Initiates the engine.
 * @class
 * @classdesc Manages modules.
 */
function Engine() {
    var self = this;
    var allModules = ["core", "animation", "audio-manager", "resource-manager", "debug", "particle", "camera", "tilemap"];

    /** The current version of the engine. */
    this.version = "0.1";

    /** The root of the module files. */
    this.root = "/";

    /** Stores loaded modules. */
    this.loadedModules = [];

    /** Loads the given modules.
     * @param {Array} modules - The name of the modules to load.
     * @param {Function} [callback] - A function that will be called when the modules are done loading.
     */
    this.loadModules = function(modules, callback) {
        var toLoad = modules.length;

        for(var i = 0; i < modules.length; i++) {
            (function(moduleName) {
                    $.getScript(self.root + moduleName + ".js", function() {
                    self.loadedModules.push(moduleName);
                    if(--toLoad == 0 && callback)
                        callback();
                })
            })(modules[i]);
        }
    };

    /** Loads every single module available in this engine.
     * @param {Function} [callback] - A function that will be called when the modules are done loading.
     */
    this.loadAllModules = function(callback) {
        this.loadModules(allModules, callback);
    };

    /** Checks if a given module is loaded.
     * @param {String} moduleName - The name of the module to check for.
     * @returns {Boolean} Whether or not the module is loaded.
     */
    this.isModuleLoaded = function(moduleName) {
        return this.loadedModules.indexOf(moduleName) != -1;
    };
};

// Initialize the engine
var engine = new Engine();
