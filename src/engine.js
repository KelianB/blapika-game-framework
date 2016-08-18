/** Initiates the engine.
 * @class 
 * @classdesc Manages modules.
 */
function Engine() {
    var self = this;
    var allModules = ["core", "animation", "audio-manager", "resource-manager", "debug"];
    
    /** The current version of the engine. */
    this.version = "0.1";
    
    /** The root of the module files. */
    this.root = "/"; 
    
    /** Stores loaded modules */
    this.loadedModules = [];
    
    this.loadModules = function(modules, callback) {
        var toLoad = modules.length;
        
        for(var i = 0; i < modules.length; i++) {
            $.getScript(self.root + modules[i] + ".js", function() {
                self.loadedModules.push(modules[i]);
                if(--toLoad == 0 && callback)
                    callback();
            })
        }
    }; 
    
    this.loadAllModules = function(callback) {
        this.loadModules(allModules, callback);  
    }; 
    
    this.isModuleLoaded = function(moduleName) {
        return this.loadedModules.indexOf(moduleName) != -1;
    };

};

var engine = new Engine();