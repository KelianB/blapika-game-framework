/*
    global $ Engine
*/

/** @class
 * @classdesc This class allows to spawn, render and update particles
 * @param {Object} config - The configuration of this particle spawner.
 * 
 * @param {Object|Integer} [config.lifeTime=-1]       - The amount of ticks after which a particle will be removed (either an int or {min: __, max: __}).
 * @param {Object|Number}  [config.speed=5]           - The starting speed of particles (either a number or {min: __, max: __}).
 * @param {Object|Integer} [config.spawnCount=10]     - The amount of particles that will spawn by default when the spawn function is called (either a number or {min: __, max: __}).
 * @param {Number}         [config.opacity=1]         - The initial opacity of particles (between 0 and 1).
 * 
 * @param {Object}         [config.position]          - The default spawning position particles. Structure: {x: Number | {min: __, max: __}, y: Number | {min: __, max: __}.
 * @param {Number}         [config.width=32]          - The default width of particles.
 * @param {Number}         [config.height=32]         - The default height of particles.
 * 
 * @param {Number}         [config.fadeInSpeed=0]     - By how much the opacity of particles is incremented at each tick until reaching 1 (between 0 and 1).
 * @param {Number}         [config.fadeOutSpeed=0]    - By how much the opacity of particles is decremented at each tick until reaching 0 (between 0 and 1). The fade-out starts before the particle's lifetime is reached, so that the opacity is at 0 right before the particle is removed.
 * 
 * @param {Function}       [config.customUpdate]      - A function that will be called on each particle update, with the particle as the <i>this</i> object.
 * @param {Function}       [config.customRender]      - A function that will be called after rendering the particle image and before removing the rotation, translation and opacity transforms. The particle is accessible as the <i>this</i> object.
 * @param {Function}       [config.customRenderAbsolute] - A function that will be called after rendering the particle image and removing the rotation, translation and opacity transforms. The particle is accessible as the <i>this</i> object.
 * 
 * @param {Function}       [config.onParticleAdded]   - A function that will be called every time a particle is spawned. params: (particle, spawnIndex).
 * @param {Function}       [config.onParticleRemoved] - A function that will be called every time a particle is removed. params: (particle).
 *  
 * @param {Image}          [config.image]             - The image that will be used for rendering each particle. This property has priority over config.images.
 * @param {Image[]}        [config.images]            - An array from which the image of each spawned particle will be randomly selected.
 * 
 * @param {Object[]}       [config.spawnAngles=[{min: 0, max: Math.PI * 2}]] - An array of angles at which particles can spawn. Each angle can be either a number of an interval {min __, max: __}.
 * 
 * 
 * 
 */
Engine.prototype.ParticleSpawner = function(config) {
    var defaults = {
        lifeTime: -1,
        speed: 5,
        spawnCount: 10,
        opacity: 1,
        
        position: {x: 0, y: 0},
        width: 32,
        height: 32,
        
        fadeInSpeed: 0,
        fadeOutSpeed: 0,
        
        customRender: function() {},
        customRenderAbsolute: function() {},
        customUpdate: function() {},
        
        onParticleAdded: function(particle) {},
        onParticleRemoved: function(particle) {},
        
        image: null, // has priority over images
        images: null,
        
        spawnAngles: [{min: 0, max: Math.PI * 2}],
        
        // stuff below still needs documentation
        
        // might need to change some stuff
        xMovement: {acceleration: 0, minSpeed: -1000, maxSpeed: 1000},
        yMovement: {acceleration: 0, minSpeed: -1000, maxSpeed: 1000},
        rotation: {acceleration: 0, minSpeed: 0, maxSpeed: 0, initial: {min: 0, max: 0}},
        
    };  

    this.config = {};
    
    for(var key in defaults) {
        this.config[key] = typeof config[key] == "undefined" ? defaults[key] : config[key];
        // Iterate over sub-objects
        if(typeof this.config[key] == "object") {
            for(var key2 in defaults[key]) {
                this.config[key][key2] = typeof this.config[key][key2] == "undefined" ? defaults[key][key2] : this.config[key][key2];
            }
        }
        
    }

    this.particles = [];
    
    /** Spawn particles using the specified configuration */
    this.spawn = function(config) {
        for(var key in this.config)
            config[key] = config[key] || this.config[key];

        function randInRange(obj) {return randomInRange(obj.min, obj.max);}

        var spawnCount = typeof config.spawnCount === "object" ? Math.floor(randInRange(config.spawnCount)) : config.spawnCount;

        for(var i = 0; i < spawnCount; i++) {
            var angle = randInArray(config.spawnAngles);
            angle = typeof angle === "object" ? randInRange(angle) : angle;
            
            var particleParams = {
                lifeTime: typeof config.lifeTime   === "object" ? Math.floor(randInRange(config.lifeTime))   : config.lifeTime,
                speed:    typeof config.speed      === "object" ?           (randInRange(config.speed))      : config.speed,
                x:        typeof config.position.x === "object" ?           (randInRange(config.position.x)) : config.position.x,
                y:        typeof config.position.y === "object" ?           (randInRange(config.position.y)) : config.position.y,
                angle: angle,
                image: config.image ? config.image : (config.images ? randInArray(config.images) : null),

                rotation: randInRange(config.rotation.initial),
            };
        
            var p = new engine.Particle(this, particleParams, config);
            
            this.particles.push(p);
            this.config.onParticleAdded(p, i);
        }
    };

    /** Updates the particles. Has to be called on each engine tick. */
    this.update = function(){
        for(var i = 0; i < this.particles.length; i++) {
            if(!this.particles[i].update()) {
                this.config.onParticleRemoved(this.particles[i]);
                this.particles.splice(i--, 1);
            }
        }
    };
    
    /** Render the particles. Has to be called on each engine tick. */
    this.render = function(ctx) {
        for(var i = 0; i < this.particles.length; i++)
            this.particles[i].render(ctx);
    };
    
    function randInArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];   
    }
    
    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }
};

Engine.prototype.Particle = function(spawner, params, config) {
    this.x = params.x;
    this.y = params.y;
    this.r = params.rotation;
    
    this.width = config.width || (params.image ? params.image.width : 0);
    this.height = config.height || (params.image ? params.image.height : 0);
    
    this.initialX = params.x;
    this.initialY = params.y;
    
    this.dx = Math.cos(params.angle) * params.speed;
    this.dy = Math.sin(params.angle) * params.speed;
    this.dr = 0;
    
    this.livingTicks = 0;
    this.lifeTime = params.lifeTime;
    
    this.image = params.image;
    this.opacity = config.opacity;
    
    this.doneFadingIn = false;
    
    this.update = function() {
        this.livingTicks++;

        if(this.livingTicks == this.lifeTime)
            return false;
        
        // Handle fade-in
        if(config.fadeInSpeed && !this.doneFadingIn) {
            this.opacity += config.fadeInSpeed;
            if(this.opacity >= 1) {
                this.opacity = 1;
                this.doneFadingIn = true;
            }
        }
        // Handle fade-out
        else if(config.fadeOutSpeed) {
            // Calculate the ending opacity if we were to start fading out now.
            var endOpacity = this.opacity - (this.lifeTime - this.livingTicks) * config.fadeOutSpeed;
            if(endOpacity > -config.fadeOutSpeed) {   
                this.opacity -= config.fadeOutSpeed;
                this.opacity = Math.max(0, this.opacity);
            }
        }

        this.dx += config.xMovement.acceleration;
        this.dx = Math.min(Math.max(this.dx, config.xMovement.minSpeed), config.xMovement.maxSpeed);
        
        this.dy += config.yMovement.acceleration;
        this.dy = Math.min(Math.max(this.dy, config.yMovement.minSpeed), config.yMovement.maxSpeed);
        
        this.dr += config.rotation.acceleration;
        this.dr = Math.min(Math.max(this.dr, config.rotation.minSpeed), config.rotation.maxSpeed);

        this.r += this.dr;
        this.x += this.dx;
        this.y += this.dy;

        config.customUpdate.apply(this);
        
        return true;
    };
    
    this.render = function(ctx) {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.r);
        ctx.globalAlpha = this.opacity;
        
        if(this.image)
            ctx.drawImage(this.image, -this.width / 2, this.height / 2, this.width, this.height);
            
        config.customRender.apply(this, [ctx]);
            
        ctx.globalAlpha = 1;
        ctx.rotate(-this.r);
        ctx.translate(-this.x, -this.y);
        
        config.customRenderAbsolute.apply(this, [ctx]);
    };
};