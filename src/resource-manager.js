/*
    global $ Engine
*/

/*
    Dependencies:
      - jQuery
*/

/** @class
 * @classdesc An utility class which simplifies the use of resources for JS apps. Handles loading, storage, errors, ...
 */
Engine.prototype.ResourceManager = new function() {
    var self = this;

    /** Resource types supported by this manager */
    this.types = {IMAGE: "images", SOUND: "sounds", VIDEO: "videos", DATA: "data"};
    /** Stores loaded resources of each type */
    this.resources = {"images": {}, "sounds": {}, "videos": {}, "data": {}};
    /** Current loading queue */
    this.queue = [];

    /** Returns a resource from its key.
     * @param key {string} - The indexing key of the resource.
     * @param type {string} - The type of the resource we're trying to get.
     */
    this.get = function(key, type) {return this.resources[type][key];};

    /** Returns an image from its key.
     * @param {string} key - The key of the requested image.
     */
    this.getImage = function(key) {return self.get(key, this.types.IMAGE);};

    /** Returns a sound from its key.
     * @param {string} key - The key of the requested sound.
     */
    this.getSound = function(key) {return self.get(key, this.types.SOUND);};

    /** Returns a video from its key.
     * @param {string} key - The key of the requested video.
     */
    this.getVideo = function(key) {return self.get(key, this.types.VIDEO);};

    /** Returns data from its key.
     * @param {string} key - The key of the requested data.
     */
    this.getData =  function(key) {return self.get(key, this.types.DATA);};

    /** Adds an item to the queue.
     * @param {Object} params - The parameters of the item to add to the queue {key, url, type, overwrite, onLoaded}.
     */
    this.addToQueue = function(params) {
        if(this.resources[params.type])
            this.queue.push(params);
        else
            console.error("Unknown type " + params.type + " for resource " + params.key);
    };

    /** Loads a single resource.
     * @param {Object} params - Parameters that describe the resource to load.
     *  @param {string} params.key - The storage key of the item.
     *  @param {string} params.url - The URL from which to load the resource.
     *  @param {Object} params.type - The type of content we're dealing with.
     *  @param {boolean} [params.overwrite=false] - Whether or not we should overwrite a resource with the same key.
     */
    this.loadResource = function(params) {
        var resource = this.get(params.key, params.type);
        if(!params.overwrite && resource)
            params.onLoaded(resource);

        if(!params.key || !params.type || !params.url)
            console.error("Error while loading resource " + (params.key || "") + ": missing parameters.");

        function loaded(object) {
            self.resources[params.type][params.key] = object;
            if(params.onLoaded)
                params.onLoaded();
        }
        function error() {
            console.error("Error while loading resource " + params.key + ".");
            if(params.onError)
                params.onError();
        }

        switch(params.type) {
            case this.types.IMAGE:
                var image = new Image();
                image.onload = function() {loaded(image);};
                image.onerror = function(e) {error(e);};
                image.src = params.url;
                break;
            case this.types.SOUND:
                var sound = new Audio();
                sound.oncanplaythrough = function() {
                    // Prevent call on .play()
                    this.oncanplaythrough = function(){};
                    loaded(sound);
                };
                sound.onerror = function(e) {error(e);};
                sound.src = params.url;
                break;
            case this.types.VIDEO:
                var video = $("<video>");
                video.append($("<source>").attr("src", params.url).attr("type", "video/mp4"));
                video = video[0];
                video.oncanplaythrough = function() {
                    this.oncanplaythrough = function(){};
                    loaded(video);
                };
                break;
            case this.types.DATA:
                $.get(params.url, function(data) {
                    loaded(data);
                }).error(function(e) {
                    error(e)
                });
                break;
        }
    };

    /** Loads resources from the queue.
     * @param {Object} params - Callbacks {onProgress, onLoaded, onError}.
     */
    this.loadQueue = function(params) {
        var processedCount = 0, queueLength = this.queue.length;

        for(var i = 0; i < queueLength; i++) {
            var item = this.queue[i];
            (function(item){
                self.loadResource({
                    key: item.key,
                    url: item.url,
                    type: item.type,
                    overwrite: item.overwrite,
                    onLoaded: function() {
                        processedCount++;

                        if(item.onLoaded)
                            item.onLoaded();

                        if(params.onProgress)
                            params.onProgress(processedCount / queueLength, item.key);

                        if(processedCount >= queueLength) {
                            self.queue = [];
                            if(params.onLoaded)
                              params.onLoaded();
                        }
                    },
                    onError: function(e) {
                        processedCount++;
                        console.error("Could not load resource " + item.key + ": " + e);
                        if(params.onError)
                            params.onError(item.key, e);
                    }
                });
            }(item))
        }
    };
};
