/*
    global Engine
*/

// /!\ Do not use audio.play() or audio.volume. Instead use respectively AudioManager.play and AudioManager.setVolume

/** @class
 * @classdesc An utility class which improves audio for JS apps. Extends audio capabilities and handles features such as global volume, mute, ...
 */
engine.AudioManager = class AudioManager {
    constructor() {
        /** A global volume modifier by which the volume of all sounds will be multiplied. */
        this.volumeModifier = 1;

        /** An array of sounds that are playing. */
        this.playing = [];

        /** Whether or not the audio is muted. */
        this.muted = false;

        // -------- Audio prototype changes --------

        let self = this;

        /** Fades the volume of the audio element to a given value in a given duration.
        * @param {Number} targetVolume - The volume at which the audio will end.
        * @param {Number} duration - The time it should take to reach the target volume, in milliseconds.
        * @param {function} onComplete - A function that will be called when the fading animation is finished.
        */
        Audio.prototype.fadeTo = function(targetVolume, duration, onComplete) {
           // Old jQuery code : $(this).animate({absoluteVolume: targetVolume, volume: targetVolume * self.volumeModifier}, duration, null, onComplete);

           const originalVolume = this.volume;
           const delta = targetVolume - originalVolume;

           if(delta == 0 || !duration) {
              this.volume = targetVolume;
              if(onComplete !== undefined)
                  onComplete();
              return null;
           }
           const interval = 15;
           const ticks = Math.floor(duration / interval);
           let tick = 1;
           const timer = setInterval(() => {
              this.volume = originalVolume + (tick / ticks) * delta;
              if(++tick === ticks) {
                 clearInterval(timer);
                 if(onComplete !== undefined)
                     onComplete();
              }
           }, interval);
           return timer;
        }

        /** Sets the volume of an Audio element.
        * @param {Number} volume - The new volume, between 0 and 1.
        */
        Audio.prototype.setVolume = function(volume) {
            this.absoluteVolume = volume;
            self.applyVolumeTransforms(this);
        };
    }

    /** Sets the playing volume of a given Audio element, handling the global volume modifier.
     * @param {Audio} audio - The target Audio element.
     */
    applyVolumeTransforms(audio) {
        audio.absoluteVolume = typeof audio.absoluteVolume === "undefined" ? 1 : audio.absoluteVolume;
        audio.volume = audio.absoluteVolume * this.volumeModifier;
    };

    /** Sets the volume modifier which will multiply the volume of all sounds.
     * @param {Number} volumeModifier - The volume multiplier, between 0 and 1.
     */
    setVolumeModifier(volumeModifier) {
        this.volumeModifier = volumeModifier;
        for(let i = 0; i < this.playing.length; i++)
            this.applyVolumeTransforms(this.playing[i]);
    };

    /** Plays audio after cloning the audio element, allowing it to be played multiple times simultaneously.
     * @param {Audio} audio - The audio element to play.
     * @param {Object} [fadeIn] - An object describing how to fade the audio (properties: start, end, duration).
     */
    playRepeatable(audio, fadeIn) {
        let clonedAudio = audio.cloneNode();
        this.play(clonedAudio, false, fadeIn);
        return clonedAudio;
    };

    /** Stops a given sound.
     * @param {Audio} audio - The audio element to stop.
     * @param {Number} [fadeOutDuration] - The duration during which the sound will fade out (in milliseconds).
     */
    stop(audio, fadeOutDuration) {
        if(audio.fadeOutInterval)
            clearInterval(audio.fadeOutInterval);

         // Handle fading out
         if(!audio.initialVolume)
             audio.initialVolume = audio.absoluteVolume;
         audio.fadeOutInterval = audio.fadeTo(0, fadeOutDuration, () => {
            audio.fadeOutInterval = null;
            audio.pause();
            audio.currentTime = 0;

            if(this.playing.indexOf(audio) != -1)
               this.playing.splice(this.playing.indexOf(audio), 1);
         });

    };


    /** Plays audio.
     * @param {Audio} audio - The audio element to play.
     * @param {Boolean} [reset=false] - Whether or not to reset the currentTime of the Audio before playing it.
     * @param {Object} [fadeIn] - An object describing how to fade the audio (properties: start, end, duration).
     */
    play(audio, reset, fadeIn) {
        if(!audio instanceof Audio) {
            console.error("[AudioManager] Couldn't play audio! audio is not an instance of Audio.")
            return;
        }
        if(audio.fadeOutInterval != null)
            clearInterval(audio.fadeOutInterval);

        // The following lines are here because the playRepeatable function clones the node, which doesn't keep the prototype functions.
        if(!audio.fadeTo)
            audio.fadeTo = Audio.prototype.fadeTo;
        if(!audio.setVolume)
            audio.setVolume = Audio.prototype.setVolume;

        if(reset)
            audio.currentTime = 0;

        let playArgs = arguments;

        if(!audio.hasEndingListener) {
            audio.addEventListener("ended", () => {
                // Handle looping
                let shouldLoop = audio.loopingCount && (audio.loopingCount == -1 || audio.loopingCount-- > 0);
                if(shouldLoop) {
                    if(audio.loopingCount == 0)
                        delete audio.loopingCount; // stop looping
                    else
                        this.play.apply(this, playArgs); // play the sound again
                }
                else {
                    // Remove from playing array
                    this.playing.splice(this.playing.indexOf(audio), 1);
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
    loop(audio, count, fadeIn) {
        count = count || -1;

        audio.loopingCount = count;
        this.play(audio, true, fadeIn);

        return audio;
    };

    /** Toggles mute for all audio elements. */
    toggleMute() {
        this.muted = !this.muted;

        for(let i = 0; i < this.playing.length; i++)
            this.playing[i].muted = this.muted;
    };

    /** Stops all audio currently playing.
     * @param {Number} [fadeOutDuration] - The duration of the fade-out effect.
     */
    stopAll(fadeOutDuration) {
        for(let i = 0; i < this.playing.length; i++) {
            let audio = this.playing[i];
            if(typeof fadeOutDuration == "undefined")
                this.stop(audio);
            else {
                audio.fadeTo(0, fadeOutDuration);
                setTimeout(() => {
                    this.stop(audio);
                }, fadeOutDuration);
            }
        }
    };
};

engine.audioManager = new engine.AudioManager();
