/* global LZString TILESET_LIST getPropFromName engine */


// This is used to fix weird lines appearing on the canvas on firefox 
function bitwiseRound(value) {
    // ~~ is a double NOT bitwise operator, which acts as a substitute for Math.floor
    return ~~(value + 0.5);
}

/** Creates a map.
 * @class
 * @classdesc Stores 2D maps and utility functions.
 */ 
function Map(rawData) {
    var that = this;
    
    /** List of layers. */
    this.layers = [];
    
    /** Stores callbacks that will be fired right after a layer is rendered. */
    this.layerRenderCallbacks = [];
    
    /** Prop storage. */
    this.props = [];

    this.camera = null;
    this.tileSize = 32;

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
    
    /** The dimensions of the map display. If null, the map will use the dimensions of the game. This is used to calculate the visibleRectangle. */
    this.viewDimensions = null;
    
    this.visibleRectangle = {
        startRow: 0, startCol: 0, endRow: 0, endCol: 0  
    };
    
    this.layerByNames = {};
    
    /** A global update function that will be called for each prop. */
    this.globalPropUpdate = null;

    this.translation = {x: 0, y: 0};
    
    var recalculateTilePositions = true;
    
    this.getScalingX = function() {return engine.Core.renderScaling.x * (this.camera ? this.camera.scaling : 1);} 
    this.getScalingY = function() {return engine.Core.renderScaling.y * (this.camera ? this.camera.scaling : 1);}
    this.applyScalingX = function(value) {return bitwiseRound(this.getScalingX() * value);}
    this.applyScalingY = function(value) {return bitwiseRound(this.getScalingY() * value);}

    this.setCamera = function(camera) {
        this.camera = camera;
    };  

    this.getLayerByName = function(name) {
        return this.layerByNames[name];  
    };

    /** Renders the map. 
     * @param {CanvasRenderingContext2D} ctx - The context on which to render the map.
     */
    this.render = function(ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        
        ctx.save();
            ctx.translate(this.translation.x, this.translation.y);
    
            this.drawTileLayers(ctx);
            this.drawProps(ctx);
            
            if(this.displayGrid)
                this.drawGrid(ctx);
        ctx.restore();
    };
    
    this.forEachVisibleTile = function(callback) {
        for(var row = this.visibleRectangle.startRow; row < this.visibleRectangle.endRow; row++) {
            for(var col = this.visibleRectangle.startCol; col < this.visibleRectangle.endCol; col++) {
                callback(row, col);
            }
        }
    };
    
    this.update = function() {
        if(this.camera) {
            // Calculate translation
            this.translation.x = -this.applyScalingX(this.camera.position.x / this.camera.scaling);
            this.translation.y = -this.applyScalingY(this.camera.position.y / this.camera.scaling);
            
            // Calculate visible rectangle
            var pxWidth =  this.viewDimensions ? this.viewDimensions.width  : engine.Core.width,
                pxHeight = this.viewDimensions ? this.viewDimensions.height : engine.Core.height;
            this.visibleRectangle.startRow = Math.max(0, Math.floor(-this.translation.y / this.getScalingY() / this.tileSize));
            this.visibleRectangle.startCol = Math.max(0, Math.floor(-this.translation.x / this.getScalingX() / this.tileSize));
            this.visibleRectangle.endRow = Math.min(this.rows, Math.ceil(this.visibleRectangle.startRow + 1 + pxHeight / (this.tileSize * this.camera.scaling)));
            this.visibleRectangle.endCol = Math.min(this.cols, Math.ceil(this.visibleRectangle.startCol + 1 + pxWidth  / (this.tileSize * this.camera.scaling)));
        }
        
        // Make sure the tile positions get recalculated with the right scaling whenever the scaling changes
        if((this.camera && this.camera.hasScalingChanged) || engine.Core.hasScalingChanged)
            recalculateTilePositions = true;
            
        // Update props
        for(var i = 0; i < this.props.length; i++) {
            var p = this.props[i];
            
            if(this.globalPropUpdate)
                this.globalPropUpdate.apply(p, []);

            if(p.template.customUpdate)
                p.template.customUpdate.apply(p, []);
        }
        
        // Tiles custom update
        for(var i = 0; i < this.layers.length; i++) {
            var tiles = this.layers[i].tiles;
            for(var row = 0; row < tiles.length; row++) {
                for(var col = 0; col < tiles[row].length; col++) {
                    var tile = tiles[row][col];
                    
                    if(recalculateTilePositions) {
                        tile.x = this.applyScalingX(col       * this.tileSize),
                        tile.y = this.applyScalingY(row       * this.tileSize),
                        tile.w = this.applyScalingX((col + 1) * this.tileSize) - tile.x,
                        tile.h = this.applyScalingY((row + 1) * this.tileSize) - tile.y;
                    }
                    
                    if(tile.customUpdate)
                        tile.customUpdate();
                }
            }
        }
    };
    
    /** Renders the grid lines. 
     * @param {CanvasRenderingContext2D} ctx - The context on which to render the grid.
     */
    this.drawGrid = function(ctx) {
        ctx.strokeStyle = "rgba(30, 30, 30, 0.5)";
        ctx.lineWidth = 1;
        
        var xScaledTileSize = this.applyScalingX(this.tileSize),
            yScaledTileSize = this.applyScalingY(this.tileSize);
            
        this.forEachVisibleTile(function(row, col) {
            ctx.strokeRect(this.applyScalingX(col * this.tileSize), this.applyScalingY(row * this.tileSize), xScaledTileSize, yScaledTileSize);
        });
    };
    
    /** Renders the map layers. 
     * @param {CanvasRenderingContext2D} ctx - The context on which to render the layers.
     */ 
    this.drawTileLayers = function(ctx) {
        for(var t = 0; t < this.layers.length; t++) {
            this.layers[t].render(ctx, this);
            
            ctx.save();
                ctx.scale(this.getScalingX(), this.getScalingY());
                for(var i = 0; i < this.layerRenderCallbacks.length; i++)
                    this.layerRenderCallbacks[i](t, ctx);
            ctx.restore();
        }
    };
    
    /** Renders the props. 
     * @param {CanvasRenderingContext2D} ctx - The context on which to render the props.
     */ 
    this.drawProps = function(ctx) {
        for(var i = 0; i < this.props.length; i++) {
            var p = this.props[i];
            
            ctx.save();
                ctx.translate(this.applyScalingX(p.x), this.applyScalingY(p.y));
                
                var regularRender = true;
                
                if(p.template.customRender)
                    regularRender = p.template.customRender.apply(p, [ctx]);
                
                if(regularRender)
                    ctx.drawImage(p.template.img, 0, 0, this.applyScalingX(p.template.img.width), this.applyScalingY(p.template.img.height));
            ctx.restore();
        }
    };
    
    /** Adds a callback that will be fired when a layer is rendered.
     * @param {function} func - The callback.
     */
    this.onLayerRendered = function(func) {
        this.layerRenderCallbacks.push(func);
    };

    /** Changes the size of the map.
     * @param {int} cols - The width of the map, in cells.
     * @param {int} rows - The height of the map, in cells.
     */
    this.setSize = function(cols, rows) {
        for(var t = 0; t < this.layers.length; t++)
            this.layers[t].setSize(cols, rows);
        
        this.cols = cols;
        this.rows = rows;
        this.width = this.cols * this.tileSize;
        this.height = this.rows * this.tileSize;
    };

    
    /** Sorts the props by ascending bottom-y value. (mostly used in top-down games) */
    this.sortPropsByZ = function() {
        this.props.sort(function(a, b) {
            var zA = a.y * that.tileSize + a.height,
                zB = b.y * that.tileSize + b.height;
            
            if(zA == zB)
                return a.id - b.id;

            return zA - zB;
        });
    };
    
    this.parse = function(rawData) {
        var data = JSON.parse(LZString.decompressFromBase64(rawData)); 
        
        for(var i = 0; i < data.layers.length; i++) {
            var l = new MapLayer(data.layers[i]);
            this.layers.push(l);
            this.layerByNames[l.name] = l;
        }
        
        this.setSize(data.layers[0].tiles[0].length, data.layers[0].tiles.length);
            
        this.props = [];
        for(var i = 0; i < data.props.length; i++) {
            var p = {id: Math.random(), name: data.props[i].name, x: data.props[i].x * this.tileSize, y: data.props[i].y * this.tileSize};
            p.template = getPropFromName(p.name);
            this.props.push(p);
        }
                    
        for(var i = 0; i < this.layers.length; i++) {
            var l = this.layers[i];
            for(var j = 0; j < TILESET_LIST.length; j++) {
                if(TILESET_LIST[j].name == l.tileset) {
                    l.tileset = new Tileset(rm.getImage("tileset-" + j), TILESET_LIST[j].tileSize);
                    break;
                }
            }
        }
    };

    this.parse(rawData);
}


/** Creates a map layer.
 * @class
 * @classdesc Stores a layer of tiles for a map.
 * @param {string} name - The name of the layer.
 * @param {Tileset} tileset - The tileset of the layer.
 */ 
function MapLayer(data) {
    var self = this;
    
    /** Tiles array. [rows][cols]. */
    this.tiles = data.tiles;
    for(var i = 0; i < this.tiles.length; i++) {
        for(var j = 0; j < this.tiles[i].length; j++) {
            this.tiles[i][j] = new Tile(this.tiles[i][j]);
        }
    }
    
    /** Name of the layer. */
    this.name = data.name;
    
    /** Tileset used by the layer for rendering. */
    this.tileset = data.tileset || {};
    
    /** Whether or not this layer should be rendered. */
    this.visible = data.visible;
    
    /** Renders this layer. 
     * @param {CanvasRenderingContext2D} ctx - The context on which to render the layer.
     */
    this.render = function(ctx, map) {
        if(!this.visible || !this.tileset || !this.tileset.image)
            return;

        map.forEachVisibleTile(function(row, col) {
            var tile = self.tiles[row][col];
            
            if(tile.customRenderBelow)
                tile.customRenderBelow(ctx, tile.x, tile.y, tile.w, tile.h);
            
            if(tile.id != 0) {
                var tsCoords = self.tileset.indexToPosition(tile.id);
                ctx.drawImage(self.tileset.image, 
                    tsCoords.x, tsCoords.y, self.tileset.tileSize, self.tileset.tileSize,
                    tile.x, tile.y, tile.w, tile.h);
            }
            
            if(tile.customRender)
                tile.customRender(ctx, tile.x, tile.y, tile.w, tile.h);
        })
    };
    
    /** Sets the size of the layer and refreshes the tiles array 
     * @param {int} cols - The new number of columns.
     * @param {int} rows - The new number of rows.
     */ 
    this.setSize = function(cols, rows) {
        this.tiles.length = rows;
            
        // Make sure all tiles have a value.
        for(var row = 0; row < rows; row++) {
            if(!this.tiles[row])
                this.tiles[row] = [];
            
            this.tiles[row].length = cols;
                
            for(var col = 0; col < cols; col++) {
                if(!this.tiles[row][col])
                    this.tiles[row][col] = 0;
            }
        }
    };
}


function Tile(id) {
    this.id = id;
}

/** Creates a tileset.
 * @class
 * @classdesc Stores the data of a tileset, used for drawing a map.
 * @param {Image} image - The tileset image.
 * @param {int} tileSize - The size of one tile on the tileset.
 */ 
function Tileset(image, tileSize) {
    /** The image used for rendering tiles. */
    this.image = image;
    
    /** The size of one tile on the tileset. */
    this.tileSize = tileSize;
    
    /** The number of rows across the tileset.*/
    this.rows = Math.floor(this.image.height / this.tileSize);
    
    // The number of columns acrolls the tileset.
    this.cols = Math.floor(this.image.width / this.tileSize);
    
    /** @typedef Position
     * @type Object
     * @property {int} x - The x coordinate.
     * @property {int} y - The y coordinate.
     */ 
    
    /** Converts a tile index into its coordinates on the tileset.
     * @param {int} index - The index of the tile.
     * @returns {Position} The position of the tile on the tileset.
     */
    this.indexToPosition = function(index) {
        return {
            x:            (index % this.cols) * this.tileSize, 
            y : Math.floor(index / this.cols) * this.tileSize
        };        
    };
}
