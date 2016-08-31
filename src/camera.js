/*
    global Engine engine
*/

/** @class
 * @classdesc Describe class here.
 * 
 */
Engine.prototype.Camera = function(config) {
    config = config || {};
    this.speed = {x: 0.2, y: 0.2};
    this.bounds = {minX: null, maxX: null, minY: null, maxY: null};
    
    this.scalingPoint = {x: 0, y: 0};
    this.scaling = config.scaling || 1;
    this.targetScaling = config.scaling || 1;
    this.onScalingFinished = null;
    
    this.rotation = 0;
    
    this.position = {x: 0, y: 0};
    this.targetPosition = {x: 0, y: 0};
    this.onTranslationFinished = null;
    this.attachedEntity = null;
    
    this.hasScalingChanged = false;

    this.update = function() {
        this.hasScalingChanged = false;
        
        if(this.attachedEntity) {
            this.targetPosition.x = this.attachedEntity.x * this.scaling - (game.width / 2);
            this.targetPosition.y = this.attachedEntity.y * this.scaling - (game.height / 2);
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
            var preScaling = this.scaling;
            this.scaling += (this.targetScaling - this.scaling) * 0.2;
            var relativeScaling = this.scaling / preScaling;
            
            this.hasScalingChanged = true;
            
            this.targetPosition.x = this.position.x * relativeScaling + this.scalingPoint.x * (relativeScaling - 1);
            this.position.x = this.targetPosition.x;
            this.targetPosition.y = this.position.y * relativeScaling + this.scalingPoint.y * (relativeScaling - 1);
            this.position.y = this.targetPosition.y;
            
            if(Math.abs(this.targetScaling - this.scaling) < 0.001)
                this.scaling = this.targetScaling;
                
            if(this.onScalingFinished && Math.abs(this.targetScaling - this.scaling) < 0.02) {
                this.onScalingFinished();
                this.onScalingFinished = null;
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
    
    this.isAtTargetPos = function() {
        return this.targetPosition.x == this.position.x && this.targetPosition.y == this.position.y;  
    };
    
    this.attachToEntity = function(entity) {
        this.attachedEntity = entity;
    };
    
    this.detachEntity = function() {
        this.attachedEntity = null;
    };
    
    this.setTargetPosition = function(x, y, onFinished) {
        this.targetPosition.x = x;
        this.targetPosition.y = y;
        this.onTranslationFinished = onFinished;
    };
    
    this.setTargetScaling = function(scaling, scalingPoint, onFinished) {
        this.targetScaling = scaling;
        // Avoid negative scaling
        this.targetScaling = Math.max(this.targetScaling, 0.01);

        this.scalingPoint = scalingPoint || {x: 0, y: 0};
        this.onScalingFinished = onFinished;
    };
    
    this.applyTransforms = function(ctx) {
        ctx.translate(-this.position.x, -this.position.y);  
        ctx.scale(this.scaling, this.scaling);
    };
    
    this.setBounds = function(minX, minY, maxX, maxY) {
        this.bounds.minX = minX;
        this.bounds.minY = minY;
        this.bounds.maxX = maxX;
        this.bounds.maxY = maxY;
    };
};