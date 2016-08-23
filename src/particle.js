/*
    global $ Engine
*/

/** @class
 * @classdesc This class allows to spawn, render and update particles
 * @param {Object} config - The configuration of this particle spawner.
 * 
 * 
 * ----------- REDO ----------- 
 * @param {Number} config.minSpawnDx - Default 0
 * @param {Number} config.maxSpawnDx - Default 0
 * @param {Number} config.minSpawnDy - Default 0
 * @param {Number} config.maxSpawnDy - Default 0
 * @param {Number} config.minSpawnRotation - Not implemented
 * @param {Number} config.maxSpawnRotation - Not implemented
 * @param {Number} config.maxSpawnDr - Not implemented
 * @param {Number} config.minSpawnDr - Not implemented
 * @param {Number} config.maxDuration - Default -1. Reduced by 1 every tick. Remove particle when reach 0
 * @param {Number} config.minDuration - Default -1. Reduced by 1 every tick. Remove particle when reach 0
 * @param {Array} config.images - An array of Image objects. Images will be chosen randomly when rendering a particle
 * @param {Object} config.image - Do not use with the images params. Used to render a particle
 * @param {Boolean} config.fadeOut - Default false. Remove particles smoothly when set to true.
 * @param {Boolean} config.fadeSpeed - Default 0.1
 * @param {Number} config.minDx - Not implemented
 * @param {Number} config.maxDx - Not implemented
 * @param {Number} config.minDy - Not implemented
 * @param {Number} config.maxDy - Not implemented
 * @param {Number} config.opacity - Default 1.0
 * @param {Number} config.gravity - Default 0. Add its value every tick to dy
 * @param {Number} config.wind - Default 0. Add its value every tick to dx
 * @param {Number} config.rotateModifier - Default 0. Add its value every tick to dr
 * @param {Number} config.spawnCount - Default 10. Number of particle to spawn
 */
Engine.prototype.ParticleSpawner = function(config) {
    var defaults = {
        lifeTime: {min: 30, max: 50},
        speed: {min: 4, max: 5},
        spawnAngleIntervals: [{min: 0, max: Math.PI * 2}],
        opacity: 1,
        customRender: function() {},
        customRenderTransformed: function() {},
        customUpdate: function() {},
        xMovement: {acceleration: 0, minSpeed: -1000, maxSpeed: 1000},
        yMovement: {acceleration: 0, minSpeed: -1000, maxSpeed: 1000},
        rotation: {acceleration: 0, minSpeed: 0, maxSpeed: 0, initial: {min: 0, max: 0}},
        
        width: 30,
        height: 30,
        fadeOutSpeed: 0,
        fadeInSpeed: 0,
        spawnCount: 5,
        
        onParticleAdded: function(particle) {},
        onParticleRemoved: function(particle) {},
    };  

    this.config = {};
    
    for(var key in defaults) {
        this.config[key] = typeof(config[key]) == "undefined" ? defaults[key] : config[key];
    }

    this.config.images = config.images || [config.image];

    this.particles = [];
    
    /** Spawn particles using the specified configuration */
    this.spawn = function(config) {
        for(var key in this.config)
            config[key] = config[key] || this.config[key];

        for(var i = 0; i < config.spawnCount; i++) {
            var angleInterval = randInArray(config.spawnAngleIntervals);

            var p = new engine.Particle(this, {
                x: randomInRange(config.minSpawnX, config.maxSpawnX || config.minSpawnX),
                y: randomInRange(config.minSpawnY, config.maxSpawnY || config.minSpawnY),
                angle: randomInRange(angleInterval.min, angleInterval.max),
                speed: randomInRange(config.speed.min, config.speed.max),
                image: randInArray(config.images),
                lifeTime: Math.floor(randomInRange(config.lifeTime.min, config.lifeTime.max)),
                rotation: randomInRange(config.rotation.initial.min, config.rotation.initial.max),
            }, config);
            
            this.particles.push(p);
            this.config.onParticleAdded(p);
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
    console.log(this)
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
            
        config.customRenderTransformed.apply(this, [ctx]);
            
        ctx.globalAlpha = 1;
        ctx.rotate(-this.r);
        ctx.translate(-this.x, -this.y);
        
        config.customRender.apply(this, [ctx]);
    };
};