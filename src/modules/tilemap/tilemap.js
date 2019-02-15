/* global LZString TILESET_LIST getPropFromName */

/** Creates a map.
 * @class
 * @classdesc Stores 2D maps and utility functions.
 */
class TileMap {
    constructor(data, needsDecoding = false) {
        /** List of layers. */
        this.layers = [];

        this.camera = null;
        this.tileSize = 32;

        /** Name */
        this.name = "";

        this.imageRoot = "";

        /** Map width, in pixels. */
        this.width = 0;
        /** Map height, in pixels. */
        this.height = 0;

        /** Number of cells across the map, vertically. */
        this.rows = 0;
        /** Number of cells across the map, horizontally. */
        this.cols = 0;

        /** Whether or not the grid should be rendered. */
        this.displayGrid = false;

        /** The rectangle where the map will be display. If width or height is 0, the app dimensions will be used instead. This is used to calculate the visibleRectangle. */
        this.view = {x: 0, y: 0, width: 0, height: 0}; // TODO x and y are not supported yet

        this.tilesets = [];
        this.customAttributes = {};

        this.visibleRectangle = {
            startRow: 0, startCol: 0, endRow: 0, endCol: 0
        };

        this.assets = {};

        /** Stores callbacks that will be fired right after a layer is rendered. */
        this._layerRenderCallbacks = [];

        this._layerByNames = {};
        this._recalculateTilePositions = true;

        this._images = [];

        this.parse(needsDecoding ? JSON.parse(LZString.decompressFromBase64(data)) : data)
    }


    getScalingX() {return Engine.viewport.renderScaling.x * (this.camera ? this.camera.scaling : 1);};
    getScalingY() {return Engine.viewport.renderScaling.y * (this.camera ? this.camera.scaling : 1);};
    applyScalingX(value) {return TileMap.bitwiseRound(this.getScalingX() * value);};
    applyScalingY(value) {return TileMap.bitwiseRound(this.getScalingY() * value);};

    // This is used to fix weird lines appearing on the canvas on firefox
    static bitwiseRound(value) {
        // ~~ is a double NOT bitwise operator, which acts as a substitute for Math.floor
        //return Math.round(value);
        return ~~(value + 0.5);
    }

    setCamera(camera) {
        this.camera = camera;
    };

    getLayerByName(name) {
        let l = this._layerByNames[name];
        if(!l) { // Re-calculate layerByNames object if needed
            this._layerByNames = {};
            for(let i = 0; i < this.layers.length; i++)
                this._layerByNames[this.layers[i].name] = this.layers[i];
            l = this._layerByNames[name];
        }
        return l;
    };

    /** Renders the map.
     * @param {CanvasRenderingContext2D} ctx - The context on which to render the map.
     */
    render(ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;

        ctx.save();
            Engine.viewport.removeScaling(ctx);
            // This translation HAS to be done after removing the scaling - otherwise we get rendering artifacts
            ctx.translate(TileMap.bitwiseRound(this.getTranslationX() * Engine.viewport.renderScaling.x), TileMap.bitwiseRound(this.getTranslationY() * Engine.viewport.renderScaling.y));

            let layerCallbacksEmpty = this._layerRenderCallbacks.length == 0;

            // Render all layers (scaling is done by the MapLayer class)
            for(let i = 0; i < this.layers.length; ++i) {
                this.layers[i].render(ctx, this);

                if(!layerCallbacksEmpty) {
                    ctx.save();
                        ctx.scale(this.getScalingX(), this.getScalingY());
                        for(let j = 0; j < this._layerRenderCallbacks.length; ++j)
                            this._layerRenderCallbacks[j](i, ctx);
                    ctx.restore();
                }
            }

            if(this.displayGrid)
                this.drawGrid(ctx);
        ctx.restore();
    };

    /** Iterates over all tiles visible on screen.
     * @param {function} callback - A function that will be called for each tile with parameters (row, col)
     */
    forEachVisibleTile(callback) {
        for(let row = this.visibleRectangle.startRow; row < this.visibleRectangle.endRow; row++) {
            for(let col = this.visibleRectangle.startCol; col < this.visibleRectangle.endCol; col++) {
                callback(row, col);
            }
        }
    };

    update() {
        if(this.camera) {
            // Calculate visible rectangle
            let pxWidth =  this.view.width || Engine.width,
                pxHeight = this.view.height || Engine.height;

            this.visibleRectangle.startRow = Math.max(0, Math.floor(-this.getTranslationY() / this.camera.scaling / this.tileSize));
            this.visibleRectangle.startCol = Math.max(0, Math.floor(-this.getTranslationX() / this.camera.scaling / this.tileSize));
            this.visibleRectangle.endRow = Math.min(this.rows, Math.ceil(this.visibleRectangle.startRow + 1 + pxHeight / (this.tileSize * this.camera.scaling)));
            this.visibleRectangle.endCol = Math.min(this.cols, Math.ceil(this.visibleRectangle.startCol + 1 + pxWidth  / (this.tileSize * this.camera.scaling)));
        }

        // Make sure the tile positions get recalculated with the right scaling whenever the scaling changes
        if((this.camera && this.camera.hasScalingChanged) || Engine.viewport.hasScalingChanged) {
            this._recalculateTilePositions = true;
        }

        // Tiles width and height has to be re-calculated individually to avoid visual glitches due to scaling.
        for(let i = 0; i < this.layers.length; i++) {
            let tiles = this.layers[i].tiles;
            for(let row = 0; row < tiles.length; row++) {
                for(let col = 0; col < tiles[row].length; col++) {
                    let tile = tiles[row][col];

                    if(this._recalculateTilePositions) {
                        tile.x = this.applyScalingX(col * this.tileSize);
                        tile.y = this.applyScalingY(row * this.tileSize);
                        tile.w = this.applyScalingX((col + 1) * this.tileSize) - tile.x;
                        tile.h = this.applyScalingY((row + 1) * this.tileSize) - tile.y;
                    }
                }
            }
        }
    };

    getTranslationX() {
        return (this.camera ? -this.camera.position.x : 0);
    };

    getTranslationY() {
        return (this.camera ? -this.camera.position.y : 0);
    };

    canvasPosToMapPos(pos) {
        return {
            x: Engine.viewport.renderScaling.x / (this.camera ? this.camera.scaling : 1) * (pos.x - this.getTranslationX()),
            y: Engine.viewport.renderScaling.y / (this.camera ? this.camera.scaling : 1) * (pos.y - this.getTranslationY())
        }
    };

    posToCell(pos) {
        return {
            row: Math.max(0, Math.min(this.rows-1, Math.floor(pos.y / this.tileSize))),
            col: Math.max(0, Math.min(this.cols-1, Math.floor(pos.x / this.tileSize)))
        }
    };

    canvasPosToCell(pos) {
        return this.posToCell(this.canvasPosToMapPos(pos));
    };

    /** Renders the grid lines. Mostly used for the map editor
     * @param {CanvasRenderingContext2D} ctx - The context on which to render the grid.
     */
    drawGrid(ctx) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
        ctx.lineWidth = 1;

        this.forEachVisibleTile((row, col) => {
            ctx.strokeRect(this.applyScalingX(col * this.tileSize), this.applyScalingY(row * this.tileSize), this.applyScalingX(this.tileSize), this.applyScalingY(this.tileSize));
        });
    };

    getEntitiesByType(t) {
        let list = [];
        for(let i = 0; i < this.layers.length; i++) {
            for(let j = 0; j < this.layers[i].entities.length; j++) {
                let en = this.layers[i].entities[j];
                if(en.type == t)
                    list.push(en);
            }
        }
        return list;
    };

    /** Adds a callback that will be fired when a layer is rendered.
     * @param {function} func - The callback.
     */
    onLayerRendered(func) {
        this._layerRenderCallbacks.push(func);
    };

    /** Changes the size of the map.
     * @param {int} cols - The width of the map, in cells.
     * @param {int} rows - The height of the map, in cells.
     */
    setSize(cols, rows) {
        for(let t = 0; t < this.layers.length; t++)
            this.layers[t].setSize(cols, rows);

        this.cols = cols;
        this.rows = rows;
        this.width = this.cols * this.tileSize;
        this.height = this.rows * this.tileSize;
        this._recalculateTilePositions = true;
    };

    getTilesetByName(name) {
        for(let i = 0; i < this.tilesets.length; i++) {
            if(this.tilesets[i].name == name)
                return this.tilesets[i];
        }
    };

    applyTransforms(ctx) {
        if(this.camera)
            this.camera.applyTransforms(ctx);
        // TODO apply other translations later when implemented
    };


    /** Sorts the props by ascending bottom-y value. (mostly used in top-down games) */
    /* TODO: depth property on maps
    sortPropsByZ() {
        this.props.sort(function(a, b) {
            let zA = a.y * self.tileSize + a.height,
                zB = b.y * self.tileSize + b.height;

            if(zA == zB)
                return a.id - b.id;

            return zA - zB;
        });
    };*/

    parse(obj) {
        this.name = obj.name;
        this.imageRoot = obj.assets.imageRoot;
        this.setSize(obj.cols, obj.rows);
        this.customAttributes = obj.customAttributes;
        this.assets = obj.assets;

        let self = this;
        function processAssetUrl(url) {
            if(!url.startsWith("http://") && !url.startsWith("https://"))
                return self.imageRoot + url;
            return url;
        }

        // Add all images into an array, to be loaded later using the RM
        for(let key in obj.assets.images) {
            let url = obj.assets.images[key];
            this._images.push({key: key, url: processAssetUrl(url)});
        }

        // Load all tilesets using the RM
        for(let key in obj.assets.tilesets) {
            let t = obj.assets.tilesets[key];
            this._images.push({key: "tileset-" + key, url: processAssetUrl(t.url)});
            this.tilesets.push(new Tileset(key, t.tileSize));
        }

        // Create layers
        for(let i = 0; i < obj.layers.length; i++) {
            let l = new MapLayer(this, obj.layers[i]);
            this.layers.push(l);
            this._layerByNames[l.name] = l;
        }
    };

    loadAssets(progressCallbacks) {
        let mapQueueName = "map-" + this.fileName;

        for(let i = 0; i < this._images.length; i++) {
             Engine.resourceManager.addToQueue({
                key: this._images[i].key,
                url: this._images[i].url,
                type: Engine.resourceManager.types.IMAGE,
                queueName: mapQueueName
            });
        }

        Engine.resourceManager.loadQueue({
            queueName: mapQueueName,
            onLoaded: (e) => {
                for(let i = 0; i < this.tilesets.length; i++)
                    this.tilesets[i].onImageLoaded();

                if(progressCallbacks.onLoaded)
                    progressCallbacks.onLoaded(e);
            },
            onError: (e) => {
                console.error("Error loading map assets for map " + this.fileName + ".");
                if(progressCallbacks.onError)
                    progressCallbacks.onError(e);
            },
            onProgress: progressCallbacks.onProgress
        });
    };
}
