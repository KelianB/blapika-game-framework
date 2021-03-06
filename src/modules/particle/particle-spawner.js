
/** @class
 * @classdesc This class allows to spawn, render and update particles
 * @param {Object} config - The configuration of this particle spawner.
 *
 * @param {Object[]}       [config.spawnAngles=[{min: 0, max: Math.PI * 2}]] - An array of angles at which particles can spawn. Each angle can be either a number of an interval {min Number, max: Number}.
 * @param {Object|Integer} [config.lifeTime=-1]       - The amount of ticks after which a particle will be removed (either an int or {min: Number, max: Number}).
 * @param {Object|Number}  [config.speed=5]           - The starting speed of particles (either a number or {min: Number, max: Number}).
 * @param {Object|Integer} [config.spawnCount=10]     - The amount of particles that will spawn by default when the spawn function is called (either a number or {min: Number, max: Number}).
 * @param {Object}          [config.position]         - The default spawning position for particles. Structure: {x: Number | {min: Number, max: Number}, y: Number | {min: Number, max: Number}}.
 *   @param {Object|Number}   [config.position.x=0]          - The x coordinate (either a number or {min: Number, max: Number}).
 *   @param {Object|Number}   [config.position.y=0]          - The y coordinate (either a number or {min: Number, max: Number}).
 * @param {Number}         [config.width=32]          - The default width of particles.
 * @param {Number}         [config.height=32]         - The default height of particles.
 * @param {Number}         [config.opacity=1]         - The initial opacity of particles (between 0 and 1).
 * @param {Number}         [config.fadeInSpeed=0]     - By how much the opacity of particles is incremented at each tick until reaching 1 (between 0 and 1).
 * @param {Number}         [config.fadeOutSpeed=0]    - By how much the opacity of particles is decremented at each tick until reaching 0 (between 0 and 1). The fade-out starts before the particle's lifetime is reached, so that the opacity is at 0 right before the particle is removed.
 * @param {Function}       [config.customUpdate]      - A function that will be called on each particle update, with the particle as the <i>this</i> object.
 * @param {Function}       [config.customRender]      - A function that will be called after rendering the particle image and before removing the rotation, translation and opacity transforms. The particle is accessible as the <i>this</i> object.
 * @param {Function}       [config.customRenderAbsolute] - A function that will be called after rendering the particle image and removing the rotation, translation and opacity transforms. The particle is accessible as the <i>this</i> object.
 * @param {Function}       [config.onParticleAdded]   - A function that will be called every time a particle is spawned. params: (particle, spawnIndex).
 * @param {Function}       [config.onParticleRemoved] - A function that will be called every time a particle is removed. params: (particle).
 * @param {Image}          [config.image]             - The image that will be used for rendering each particle. This property has priority over config.images.
 * @param {Image[]}        [config.images]            - An array from which the image of each spawned particle will be randomly selected.
 * @param {Object}         [config.xMovement]         - An object that describes the horizontal movement of the particle.
 *   @param {Number}         [config.xMovement.acceleration] - The horizontal acceleration of the particles, in pixels/tick².
 *   @param {Number}         [config.xMovement.minSpeed]     - The minimum rate of change of the x coordinate, in pixels/tick.
 *   @param {Number}         [config.xMovement.maxSpeed]     - The maximum rate of change of the x coordinate, in pixels/tick.
 * @param {Object}         [config.yMovement]         - An object that describes the vertical movement of the particle.
 *   @param {Number}         [config.yMovement.acceleration] - The vertical acceleration of the particles, in pixels/tick².
 *   @param {Number}         [config.yMovement.minSpeed]     - The minimum rate of change of the y coordinate, in pixels/tick.
 *   @param {Number}         [config.yMovement.maxSpeed]     - The maximum rate of change of the y coordinate, in pixels/tick.
 * @param {Object}         [config.rotation]          - An object that describes the rotation of the particle.
 *   @param {Number}         [config.rotation.acceleration] - The acceleration of a particle's rotation, in radiant/tick².
 *   @param {Number}         [config.rotation.minSpeed]     - The minimum rate of chante of the rotation, in radiant/tick.
 *   @param {Number}         [config.rotation.maxSpeed]     - The maximum rate of chante of the rotation, in radiant/tick.
 *   @param {Object|Number}  [config.rotation.initial]     -  The initial rotation of the particle (either a number or {min: Number, max: Number}).
 */
Engine.ParticleSpawner = class ParticleSpawner {
    constructor(config) {
        let defaults = {
            spawnAngles: [{min: 0, max: Math.PI * 2}],
            lifeTime: -1,
            speed: 5,
            spawnCount: 10,

            position: {x: 0, y: 0},
            width: 32,
            height: 32,

            opacity: 1,
            fadeInSpeed: 0,
            fadeOutSpeed: 0,

            customRender: function() {},
            customRenderAbsolute: function() {},
            customUpdate: function() {},

            onParticleAdded: function(particle) {},
            onParticleRemoved: function(particle) {},

            image: null, // has priority over images
            images: null,

            xMovement: {acceleration: 0, minSpeed: -1000, maxSpeed: 1000},
            yMovement: {acceleration: 0, minSpeed: -1000, maxSpeed: 1000},
            rotation:  {acceleration: 0, minSpeed: 0, maxSpeed: 0, initial: 0}
        };

        this.config = {};

        for(let key in defaults) {
            this.config[key] = typeof config[key] == "undefined" ? defaults[key] : config[key];
            // Iterate over sub-objects
            if(typeof this.config[key] == "object") {
                for(let key2 in defaults[key]) {
                    this.config[key][key2] = typeof this.config[key][key2] == "undefined" ? defaults[key][key2] : this.config[key][key2];
                }
            }

        }

        this.particles = [];
    }

    /** Spawns particles using the specified configuration.
     * @param {Object} [config] - An object with properties that will override the spawner's configuration.
     */
    spawn(config) {
        config = config || {};

        for(let key in this.config)
            config[key] = config[key] || this.config[key];

        function randInRange(obj) {return _randomInRange(obj.min, obj.max);}

        let spawnCount = typeof config.spawnCount === "object" ? Math.floor(randInRange(config.spawnCount)) : config.spawnCount;

        for(let i = 0; i < spawnCount; i++) {
            let angle = randInArray(config.spawnAngles);
            angle = typeof angle === "object" ? randInRange(angle) : angle;

            let particleParams = {
                lifeTime: typeof config.lifeTime   === "object" ? Math.floor(randInRange(config.lifeTime))   : config.lifeTime,
                speed:    typeof config.speed      === "object" ?           (randInRange(config.speed))      : config.speed,
                x:        typeof config.position.x === "object" ?           (randInRange(config.position.x)) : config.position.x,
                y:        typeof config.position.y === "object" ?           (randInRange(config.position.y)) : config.position.y,
                rotation: typeof config.rotation.initial === "object" ?     (randInRange(config.rotation.initial)) : config.rotation.initial,
                angle: angle,
                image: config.image ? config.image : (config.images ? _randInArray(config.images) : null),
            };

            let p = new Engine.Particle(this, particleParams, config);

            this.particles.push(p);
            this.config.onParticleAdded(p, i);
        }
    };

    /** Updates the particles. Has to be called on each engine tick. */
    update() {
        for(let i = 0; i < this.particles.length; i++) {
            if(!this.particles[i].update()) {
                this.config.onParticleRemoved(this.particles[i]);
                this.particles.splice(i--, 1);
            }
        }
    };

    /** Render the particles. Has to be called on each engine tick. */
    render(ctx) {
        for(let i = 0; i < this.particles.length; i++)
            this.particles[i].render(ctx);
    };

    _randInArray(arr) {return arr[Math.floor(Math.random() * arr.length)];}
    _randomInRange(min, max) {return Math.random() * (max - min) + min;}
};
