/* global Engine */

Engine.Particle = class Particle {
    constructor(spawner, params, config) {
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
    }

    update() {
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
            let endOpacity = this.opacity - (this.lifeTime - this.livingTicks) * config.fadeOutSpeed;
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

    render(ctx) {
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
