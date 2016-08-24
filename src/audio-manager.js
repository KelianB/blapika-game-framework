/*
    global $ Engine
*/

// /!\ Do not use audio.play() or audio.volume. Instead use respectively AudioManager.play and AudioManager.setVolume

/** @class
 * @classdesc An utility class which improves audio for JS apps. Extends audio capabilities and handles features such as global volume, mute, ...
 */
Engine.prototype.AudioManager = new function() {
    var self = this;
    this.volumeModifier = 1;
    this.playing = [];
    this.muted = false;

    // -------- Audio prototype changes --------

    /** Fades the volume of the audio element to a given value in a given duration.
     * @param {Number} targetVolume - The volume at which the audio will end.
     * @param {Number} duration - The time it should take to reach the target volume, in milliseconds.
     */
    Audio.prototype.fadeTo = function(targetVolume, duration) {
        $(this).animate({volume: targetVolume}, duration);
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
        audio.absoluteVolume = audio.absoluteVolume || 1;
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
        this.play(audio.cloneNode(), false, fadeIn);
    };

    /** Plays audio.
     * @param {Audio} audio - The audio element to play.
     * @param {Boolean} [reset=false] - Whether or not to reset the currentTime of the Audio before playing it.
     * @param {Object} [fadeIn] - An object describing how to fade the audio (properties: start, end, duration).
     */
    this.play = function(audio, reset, fadeIn) {
        if(reset)
            audio.currentTime = 0;

        if(fadeIn) {
            audio.volume = fadeIn.start;
            audio.fadeTo(fadeIn.end, fadeIn.duration);
        }

        audio.addEventListener("ended", function() {
            // Remove from playing array
            self.playing.splice(self.playing.indexOf(this), 1);
        });

        this.playing.push(audio);

        audio.muted = this.muted;
        this.applyVolumeTransforms(audio);
        audio.play();
    };

    /** Plays audio repeatedly.
     * @param {Audio} audio - The audio element to play.
     * @param {Integer} [count=infinite] - How many times the audio should be played.
     */
    this.loop = function(audio, count) {
        if(count == undefined)
            count = -1;

        if(count != 0) {
            self.play(audio, true);

            audio.addEventListener("ended", function() {
                console.log(this, --count);
                self.loop(this, --count);
            });
        }
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
            if(fadeOutDuration == undefined) {
                audio.pause();
                audio.currentTime = 0;
            }
            else {
                audio.fadeTo(0, fadeOutDuration);
                setTimeout(function(){
                    audio.pause();
                }, fadeOutDuration);
            }
        }
    };
};
