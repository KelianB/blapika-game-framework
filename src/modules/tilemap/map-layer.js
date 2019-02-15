
/** Creates a map layer.
 * @class
 * @classdesc Stores a layer of tiles for a map.
 * @param {string} name - The name of the layer.
 * @param {Tileset} tileset - The tileset of the layer.
 */
class MapLayer {
    constructor(map, data) {
        /** Tiles array. [rows][cols]. */
        this.tiles = data.tiles || [];

        for(let i = 0; i < this.tiles.length; i++) {
            for(let j = 0; j < this.tiles[i].length; j++) {
                this.tiles[i][j] = new Tile(this.tiles[i][j]);
            }
        }

        /** Name of the layer. */
        this.name = data.name || "new-layer";

        /** Tileset used by the layer for rendering tiles. */
        this.tileset = map.getTilesetByName(data.tileset) || map.tilesets[0];

        /** Whether or not this layer should be rendered. */
        this.visible = data.visible || true;

        /** Entities storage */
        this.entities = data.entities || [];

        if(this.tiles.length == 0) {
            this.setSize(map.cols, map.rows); // All layer must be the same size
        }
    }

    /** Renders this layer.
     * @param {CanvasRenderingContext2D} ctx - The context on which to render the layer.
     */
    render(ctx, map) {
        if(!this.visible || !this.tileset || !this.tileset.imageLoaded)
            return;

        map.forEachVisibleTile((row, col) => {
            let tile = this.tiles[row][col];

            if(tile && tile.id != 0) {
                let tsCoords = this.tileset.indexToPosition(tile.id);

                ctx.drawImage(this.tileset.getImage(),
                    tsCoords.x, tsCoords.y, this.tileset.tileSize, this.tileset.tileSize,
                    tile.x, tile.y, tile.w, tile.h);
            }
        })
    };

    /** Sets the size of the layer and refreshes the tiles array. Generally, this is meant to be called by the Map object when changing its size.
     * @param {int} cols - The new number of columns.
     * @param {int} rows - The new number of rows.
     */
    setSize(cols, rows) {
        this.tiles.length = rows;

        // Make sure all tiles have a value.
        for(let row = 0; row < rows; row++) {
            if(!this.tiles[row])
                this.tiles[row] = [];

            this.tiles[row].length = cols;

            for(let col = 0; col < cols; col++) {
                if(!this.tiles[row][col])
                    this.tiles[row][col] = new Tile(0);
            }
        }
    };
}
