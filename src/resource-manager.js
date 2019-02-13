/*
    global Engine
*/

/*
    Dependencies:
      - jQuery
*/

/** @class
 * @classdesc An utility class which simplifies the use of resources for JS apps. Handles loading, storage, errors, ...
 */
engine.ResourceManager = class ResourceManager {
    constructor() {
        /** Resource types supported by this manager */
        this.types = {IMAGE: "images", SOUND: "sounds", VIDEO: "videos", DATA: "data"};
        /** Stores loaded resources of each type */
        this.resources = {"images": {}, "sounds": {}, "videos": {}, "data": {}};
        /** Current loading queue */
        this.queue = [];
    }

    /** Returns a resource from its key.
     * @param key {string} - The indexing key of the resource.
     * @param type {string} - The type of the resource we're trying to get.
     */
    get(key, type) {return this.resources[type][key];}

    /** Returns an image from its key.
     * @param {string} key - The key of the requested image.
     */
    getImage(key) {return this.get(key, this.types.IMAGE);}

    /** Returns a sound from its key.
     * @param {string} key - The key of the requested sound.
     */
    getSound(key) {return this.get(key, this.types.SOUND);}

    /** Returns a video from its key.
     * @param {string} key - The key of the requested video.
     */
    getVideo(key) {return this.get(key, this.types.VIDEO);}

    /** Returns data from its key.
     * @param {string} key - The key of the requested data.
     */
    getData(key) {return this.get(key, this.types.DATA);}

    /** Adds an item to the queue.
     * @param {Object} params - The parameters of the item to add to the queue {key, url, type, overwrite, onLoaded}.
     */
    addToQueue(params) {
        if(this.resources[params.type])
            this.queue.push(params);
        else
            console.error("Unknown type " + params.type + " for resource " + params.key);
    }

    /** Loads a single resource.
     * @param {Object} params - Parameters that describe the resource to load.
     *  @param {string} params.key - The storage key of the item.
     *  @param {string} params.url - The URL from which to load the resource.
     *  @param {Object} params.type - The type of content we're dealing with.
     *  @param {boolean} [params.overwrite=false] - Whether or not we should overwrite a resource with the same key.
     */
    loadResource(params) {
        let resource = this.get(params.key, params.type);
        if(!params.overwrite && resource)
            params.onLoaded(resource);

        if(!params.key || !params.type || !params.url)
            console.error("Error while loading resource " + (params.key || "") + ": missing parameters.");

        let resources = this.resources;
        function loaded(object) {
            resources[params.type][params.key] = object;
            if(params.onLoaded)
                params.onLoaded();
        }
        function error(e) {
            console.error("Error while loading resource " + params.key + ".");
            if(params.hasOwnProperty("onError"))
                params.onError(e);
        }

        switch(params.type) {
            case this.types.IMAGE: {
                let image = new Image();
                image.addEventListener("load", () => {loaded(image);});
                image.addEventListener("error", error);
                image.src = params.url;
                break;
            }
            case this.types.SOUND: {
                let sound = new Audio();
                let onCanPlayThrough = () => {
                    sound.removeEventListener("canplaythrough", onCanPlayThrough);
                    loaded(sound);
                };
                sound.addEventListener("canplaythrough", onCanPlayThrough);
                sound.addEventListener("error", error);
                sound.src = params.url;
                break;
             }
            case this.types.VIDEO: {
                let video = document.createElement("video");
                let source = document.createElement("source");

                let onCanPlayThrough = () => {
                    video.removeEventListener("canplaythrough", onCanPlayThrough);
                    loaded(video);
                };
                video.addEventListener("canplaythrough", onCanPlayThrough);
                source.addEventListener("error", error);
                source.src = params.url;
                source.type = "video/mp4";
                video.append(source);
                break;
             }
            case this.types.DATA: {
               Engine.httpGet(params.url, {
                  onLoaded: (data) => {
                     loaded(data);
                  },
                  onError: (t) => {
                     error(t);
                  }
               });
               break;
            }
        }
    }

    /** Loads resources from the queue.
     * @param {Object} params - Callbacks {onProgress, onLoaded, onError}.
     */
    loadQueue(params) {
        let processedCount = 0, queueLength = this.queue.length;

        for(let i = 0; i < queueLength; i++) {
            let item = this.queue[i];
            this.loadResource({
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
                        this.queue = [];
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
        }
    }
};

engine.resourceManager = new engine.ResourceManager();
