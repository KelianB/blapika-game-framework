
/** Creates a tileset.
 * @class
 * @classdesc Stores the data of a tileset, used for drawing a map.
 * @param {Image} image - The tileset image.
 * @param {int} tileSize - The size of one tile on the tileset.
 */
class Tileset {
    constructor(name, tileSize) {
        /** The name of this tileset, also used in the key to retrieve the image from the resource manager */
        this.name = name;

        /** The size of one tile on the tileset. */
        this.tileSize = tileSize;

        /** The number of rows across the tileset.*/
        this.rows = null;
        /** The number of columns acrolls the tileset. */
        this.cols = null;

        this.imageLoaded = false;
    }

    onImageLoaded() {
        this.rows = Math.floor(this.getImage().height / this.tileSize);
        this.cols = Math.floor(this.getImage().width / this.tileSize);

        this.imageLoaded = true;
    };

    getImage() {
         return Engine.resourceManager.getImage("tileset-" + this.name);
    };

    getImageURL() {
         return this.getImage().src;
    };

    /** @typedef Position
     * @type Object
     * @property {int} x - The x coordinate.
     * @property {int} y - The y coordinate.
     */

    /** Converts a tile index into its coordinates on the tileset.
     * @param {int} index - The index of the tile.
     * @returns {Position} The position of the tile on the tileset.
     */
    indexToPosition(index) {
        return {
            x:            (index % this.cols) * this.tileSize,
            y : Math.floor(index / this.cols) * this.tileSize
        };
    };
}
