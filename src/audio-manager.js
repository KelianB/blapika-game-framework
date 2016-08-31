/*
    global $ Engine
*/

// /!\ Do not use audio.play() or audio.volume. Instead use respectively AudioManager.play and AudioManager.setVolume

/** @class
 * @classdesc An utility class which improves audio for JS apps. Extends audio capabilities and handles features such as global volume, mute, ...
 */
Engine.prototype.AudioManager = new function() {
    var self = this;
    
    /** A global volume modifier by which the volume of all sounds will be multiplied. */
    this.volumeModifier = 1;
    
    /** An array of sounds that are playing. */
    this.playing = [];
    
    /** Whether or not the audio is muted. */
    this.muted = false;

    // -------- Audio prototype changes --------

    /** Fades the volume of the audio element to a given value in a given duration.
     * @param {Number} targetVolume - The volume at which the audio will end.
     * @param {Number} duration - The time it should take to reach the target volume, in milliseconds.
     */
    Audio.prototype.fadeTo = function(targetVolume, duration, onComplete) {
        return $(this).animate({absoluteVolume: targetVolume, volume: targetVolume * self.volumeModifier}, duration, null, onComplete);
    };

    /** Sets the volume of an Audio element.
     * @param {Number} volume - The new volume, between 0 and 1.
     */
    Audio.prototype.setVolume = function(volume) {
        this.absoluteVolume = volume;
        self.applyVolumeTransforms(this);
    };

    // -------- Audio Manager functions --------

    /** Sets the playing volume of a given Audio element, handling the global volume modifier.
     * @param {Audio} audio - The target Audio element.
     */
    this.applyVolumeTransforms = function(audio) {
        audio.absoluteVolume = typeof audio.absoluteVolume === "undefined" ? 1 : audio.absoluteVolume;
        audio.volume = audio.absoluteVolume * this.volumeModifier;
    };

    /** Sets the volume modifier which will multiply the volume of all sounds.
     * @param {Number} volumeModifier - The volume multiplier, between 0 and 1.
     */
    this.setVolumeModifier = function(volumeModifier) {
        this.volumeModifier = volumeModifier;
        for(var i = 0; i < this.playing.length; i++)
            this.applyVolumeTransforms(this.playing[i]);
    };

    /** Plays audio after cloning the audio element, allowing it to be played multiple times simultaneously.
     * @param {Audio} audio - The audio element to play.
     * @param {Object} [fadeIn] - An object describing how to fade the audio (properties: start, end, duration).
     */
    this.playRepeatable = function(audio, fadeIn) {
        var clonedAudio = audio.cloneNode();
        this.play(clonedAudio, false, fadeIn);
        return clonedAudio;
    };
    
    /** Stops a given sound.
     * @param {Audio} audio - The audio element to stop.
     * @param {Number} [fadeOutDuration] - The duration during which the sound will fade out (in milliseconds).
     */
    this.stop = function(audio, fadeOutDuration) {
        function endAndRemove() {
            audio.pause();
            audio.currentTime = 0;
            
            if(self.playing.indexOf(audio) != -1)
                self.playing.splice(self.playing.indexOf(audio), 1);
        }

        if(audio.fadeOutAnimation)
            audio.fadeOutAnimation.stop();
         
        if(typeof fadeOutDuration === "undefined")
            endAndRemove();
        else { 
            // Handle fading out
            if(!audio.initialVolume)
                audio.initialVolume = audio.absoluteVolume;
            audio.fadeOutAnimation = audio.fadeTo(0, fadeOutDuration, function() {
                audio.fadeOutAnimation = null;
                endAndRemove();
            });
        }
    };
    

    /** Plays audio.
     * @param {Audio} audio - The audio element to play.
     * @param {Boolean} [reset=false] - Whether or not to reset the currentTime of the Audio before playing it.
     * @param {Object} [fadeIn] - An object describing how to fade the audio (properties: start, end, duration).
     */
    this.play = function(audio, reset, fadeIn) {
        if(!audio instanceof Audio) {
            console.error("[AudioManager] Couldn't play audio! audio is not an instance of Audio.")
            return;
        }
        if(audio.fadeOutAnimation)
            audio.fadeOutAnimation.stop();
        
        // The following lines are here because the playRepeatable function clones the node, which doesn't keep the prototype functions.
        if(!audio.fadeTo)
            audio.fadeTo = Audio.prototype.fadeTo;
        if(!audio.setVolume)
            audio.setVolume = Audio.prototype.setVolume;
        
        if(reset)
            audio.currentTime = 0;
            
        var playArgs = arguments;
        
        if(!audio.hasEndingListener) {
            audio.addEventListener("ended", function() {
                // Handle looping
                var shouldLoop = audio.loopingCount && (audio.loopingCount == -1 || audio.loopingCount-- > 0);
                if(shouldLoop) {
                    if(audio.loopingCount == 0)
                        delete audio.loopingCount; // stop looping
                    else
                        self.play.apply(self, playArgs); // play the sound again
                }
                else {
                    // Remove from playing array
                    self.playing.splice(self.playing.indexOf(audio), 1);
                }
            });
        }
        audio.hasEndingListener = true;

        audio.muted = this.muted;
        
        // Reset the volume to what it was before it started to fade out
        if(audio.initialVolume) {
            audio.setVolume(audio.initialVolume);
            delete audio.initialVolume;
        }
        
        this.applyVolumeTransforms(audio);
        
        // Handle fading in
        if(fadeIn) {
            audio.setVolume(fadeIn.start || 0);
            audio.fadeTo(fadeIn.end || 1, fadeIn.duration);
        }
        
        if(this.playing.indexOf(audio) == -1)
            this.playing.push(audio);
        
        audio.play();
        return audio;
    };

    /** Plays audio repeatedly.
     * @param {Audio} audio - The audio element to play.
     * @param {Integer} [count=infinite] - How many times the audio should be played.
     */
    this.loop = function(audio, count, fadeIn) {
        count = count || -1;
        
        audio.loopingCount = count;
        self.play(audio, true, fadeIn);
        
        return audio;
    };

    /** Toggles mute for all audio elements. */
    this.toggleMute = function() {
        this.muted = !this.muted;

        for(var i = 0; i < this.playing.length; i++)
            this.playing[i].muted = this.muted;
    };

    /** Stops all audio currently playing.
     * @param {Number} [fadeOutDuration] - The duration of the fade-out effect.
     */
    this.stopAll = function(fadeOutDuration) {
        for(var i = 0; i < this.playing.length; i++) {
            var audio = this.playing[i];
            if(typeof fadeOutDuration == "undefined")
                this.stop(audio);
            else {
                audio.fadeTo(0, fadeOutDuration);
                setTimeout(function(){
                    self.stop(audio);
                }, fadeOutDuration);
            }
        }
    };
};
