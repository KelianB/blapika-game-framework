/* global Engine */

/** @class
 * @classdesc Describe class here.
 *
 */
Engine.Camera = class Camera {
    constructor(config) {
        config = config || {};

        this.speed = {x: 0.2, y: 0.2};
        this.bounds = {minX: null, maxX: null, minY: null, maxY: null};

        this.scalingPoint = {x: 0, y: 0};
        this.scaling = config.scaling || 1;
        this.targetScaling = config.scaling || 1;
        this.scalingSpeed = 0.2;
        this.onScalingFinished = null;

        this.rotation = 0;

        this.position = {x: 0, y: 0};
        this.targetPosition = {x: 0, y: 0};
        this.onTranslationFinished = null;
        this.attachedEntity = null;

        this.hasScalingChanged = false;
        this._MIN_SCALING = 0.075;
    }

    update() {
        this.hasScalingChanged = false;

        if(this.attachedEntity) {
            var w = this.attachedEntity.width || this.attachedEntity.w || 0;
            var h = this.attachedEntity.height || this.attachedEntity.h || 0;
            this.targetPosition.x = (this.attachedEntity.x + w / 2) * this.scaling - (Engine.core.width / 2);
            this.targetPosition.y = (this.attachedEntity.y + h / 2) * this.scaling - (Engine.core.height / 2);
        }

        if(!this.isAtTargetPos()) {
            this.position.x += (this.targetPosition.x - this.position.x) * this.speed.x;
            this.position.y += (this.targetPosition.y - this.position.y) * this.speed.y;

            if(Math.abs(this.targetPosition.x - this.position.x) < 0.001)
                this.position.x = this.targetPosition.x;
            if(Math.abs(this.targetPosition.y - this.position.y) < 0.001)
                this.position.y = this.targetPosition.y;

            if(this.isAtTargetPos() && this.onTranslationFinished) {
                this.onTranslationFinished();
                this.onTranslationFinished = null;
            }
        }

        if(this.scaling != this.targetScaling) {
            // Handle scaling toward a specified point
            if(this.scalingPoint) {
                var preScaling = this.scaling;
                this.scaling += (this.targetScaling - this.scaling) * this.scalingSpeed;
                var relativeScaling = this.scaling / preScaling;

                this.setPosition(this.position.x * relativeScaling + this.scalingPoint.x * (relativeScaling - 1),
                                 this.position.y * relativeScaling + this.scalingPoint.y * (relativeScaling - 1));

                if(Math.abs(this.targetScaling - this.scaling) < 0.001)
                    this.scaling = this.targetScaling;

                if(this.onScalingFinished && Math.abs(this.targetScaling - this.scaling) < 0.02) {
                    this.onScalingFinished();
                    this.onScalingFinished = null;
                }
            }
            else {
                this.scaling += (this.targetScaling - this.scaling) * this.scalingSpeed;
            }
        }

        if(this.bounds.minX != null) {
            if(this.position.x < this.bounds.minX)
                this.position.x = this.bounds.minX;
        }
        if(this.bounds.maxX != null) {
            if(this.position.x > this.bounds.maxX)
                this.position.x = this.bounds.maxX;
        }
        if(this.bounds.minY != null) {
            if(this.position.y < this.bounds.minY)
                this.position.y = this.bounds.minY;
        }
        if(this.bounds.maxY != null) {
            if(this.position.y > this.bounds.maxY)
                this.position.y = this.bounds.maxY;
        }
    };

    isAtTargetPos() {
        return this.targetPosition.x == this.position.x && this.targetPosition.y == this.position.y;
    };

    attachToEntity(entity) {
        this.attachedEntity = entity;
    };

    detachEntity() {
        this.attachedEntity = null;
    };

    setTargetPosition(x, y, onFinished) {
        this.targetPosition.x = x;
        this.targetPosition.y = y;
        this.onTranslationFinished = onFinished;
    };

    setPosition(x, y) {
        this.targetPosition.x = x;
        this.position.x = x;
        this.targetPosition.y = y;
        this.position.y = y;
    };

    setScaling(scaling, scalingPoint) {
        if(this.scaling == scaling)
            return;

        scaling = Math.max(this._MIN_SCALING, scaling);

        if(scalingPoint) {
            var relativeScaling = scaling / this.scaling;
            this.setPosition(this.position.x * relativeScaling + scalingPoint.x * (relativeScaling - 1),
                             this.position.y * relativeScaling + scalingPoint.y * (relativeScaling - 1));
        }

        this.scaling = scaling;
        this.targetScaling = scaling;
    };

    setTargetScaling(scaling, scalingPoint, onFinished, scalingSpeed) {
        this.targetScaling = Math.max(this._MIN_SCALING, scaling);

        this.scalingPoint = scalingPoint;
        this.onScalingFinished = onFinished;

        if(scalingSpeed)
            this.scalingSpeed = scalingSpeed;
    };


    applyTransforms(ctx) {
        ctx.translate(-this.position.x, -this.position.y);
        ctx.scale(this.scaling, this.scaling);
    };

    setBounds(minX, minY, maxX, maxY) {
        this.bounds.minX = minX;
        this.bounds.minY = minY;
        this.bounds.maxX = maxX;
        this.bounds.maxY = maxY;
    };
};
