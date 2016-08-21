/*
    global $ Engine
*/

/** @class
 * @classdesc This class allow to spawn, render and update particles
 * @param {Number} minSpawnDx - Default 0
 * @param {Number} maxSpawnDx - Default 0
 * @param {Number} minSpawnDy - Default 0
 * @param {Number} maxSpawnDy - Default 0
 * @param {Number} minSpawnRotation - Not implemented
 * @param {Number} maxSpawnRotation - Not implemented
 * @param {Number} maxSpawnDr - Not implemented
 * @param {Number} minSpawnDr - Not implemented
 * @param {Number} maxDuration - Default -1. Reduced by 1 every tick. Remove particle when reach 0
 * @param {Number} minDuration - Default -1. Reduced by 1 every tick. Remove particle when reach 0
 * @param {Array} images - An array of Image objects. Images will be chosen randomly when rendering a particle
 * @param {Object} image - Do not use with the images params. Used to render a particle
 * @param {Boolean} fadeOut - Default false. Remove particles smoothly when set to true.
 * @param {Boolean} fadeSpeed - Default 0.1
 * @param {Number} minDx - Not implemented
 * @param {Number} maxDx - Not implemented
 * @param {Number} minDy - Not implemented
 * @param {Number} maxDy - Not implemented
 * @param {Number} opacity - Default 1.0
 * @param {Number} gravity - Default 0. Add its value every tick to dy
 * @param {Number} wind - Default 0. Add its value every tick to dx
 * @param {Number} rotateModifier - Default 0. Add its value every tick to dr
 * @param {Number} spawnCount - Default 10. Number of particle to spawn
 */
Engine.prototype.Particle = function(config) {
    // Movement speed
    this.minSpawnDx = config.minSpawnDx || 0;
    this.maxSpawnDx = config.maxSpawnDx || 0;
    this.minSpawnDy = config.minSpawnDy || 0;
    this.maxSpawnDy = config.maxSpawnDy || 0;
    // Rotation
    this.minSpawnRotation = config.minSpawnRotation || 0; 
    this.maxSpawnRotation = config.maxSpawnRotation || 0; 
    this.maxSpawnDr = config.maxSpawnDr || 0;
    this.minSpawnDr = config.MinSpawnDr || 0;
    // Life time
    this.maxDuration = config.maxDuration || -1;
    this.minDuration = config.minDuration || -1;
    // Image
    this.images = config.images || [config.image];
    
    // Common to all particles
    this.fadeOut = config.fadeOut || false;
    this.fadeSpeed = config.fadeSpeed || 0.1;
    this.minDx = config.minDx || 0;
    this.maxDx = config.maxDx || 0;
    this.minDy = config.minDy || 0;
    this.maxDy = config.maxDy || 0;
    this.opacity = config.opacity || 1;
    this.gravity = config.gravity || 0;
    this.wind = config.wind || 0; // "horizontal" gravity
    this.rotateModifier = config.rotateModifier || 0;
    this.spawnCount = config.spawnCount || 10;

    this.particles = [];
    
    /** Spawn particles using the specified configuration 
     * @param {String} minSpawnX - Default undefined. Minimum x where to spawn particle
     * @param {String} maxSpawnX - Default minSpawnX. Maximum x where to spawn particle
     * @param {String} minSpawnY - Default undefined. Minimum y where to spawn particle
     * @param {String} maxSpawnY - Default minSpawnX. Maximum y where to spawn particle
     */
    this.spawn = function(config) {
        for(var i = 0; i < this.spawnCount; i++) {
            this.particles.push({
                opacity: this.opacity,
                x: randomInRange(config.minSpawnX, config.maxSpawnX || config.minSpawnX),
                y: randomInRange(config.minSpawnY, config.maxSpawnY || config.minSpawnY),
                dx: randomInRange(this.minSpawnDx, this.maxSpawnDx),
                dy: randomInRange(this.minSpawnDy, this.maxSpawnDy),
                r: randomInRange(this.minSpawnRotation, this.maxSpawnRotation),
                dr: randomInRange(this.minSpawnDr, this.maxSpawnDr),
                image: this.images[Math.floor(this.images.length * Math.random())],
                lifeTime: randomInRange(this.minDuration, this.maxDuration)
            });
        }
    };

    /** Updates the particles. Has to be called on each engine tick. */
    this.update = function(){
        // TODO: Implement min and max dx / dy
        for(var i = 0; i < this.particles.length; i++) {
            var particle = this.particles[i];
            particle.lifeTime--;
            
            if(particle.lifeTime <= 0) {
                if(this.fadeOut) {
                    particle.opacity -= this.fadeSpeed;
                    if(particle.opacity <= 0) {
                        this.particles.splice(i, 1);
                        i--;
                        continue;
                    }
                }
                else {
                    this.particles.splice(i, 1);
                    i--;
                    continue;
                }
            }
            
            particle.dx += this.wind;
            particle.dy += this.gravity;
            particle.dr += this.rotateModifier;
            
            particle.r += particle.dr;
            particle.x += particle.dx;
            particle.y += particle.dy;
            
        }
    };
    
    /** Render the particles. Has to be called on each engine tick. */
    this.render = function(ctx) {
        // TODO: Implement rotation
        for(var i = 0; i < this.particles.length; i++) {
            var particle = this.particles[i];
            ctx.globalAlpha = particle.opacity;
            ctx.drawImage(particle.image, particle.x, particle.y);
            ctx.globalAlpha = 1;
        }
    };
    
    function randomInRange(min, max) {
        return Math.random() * (max-min+1) + min;
    }
};
