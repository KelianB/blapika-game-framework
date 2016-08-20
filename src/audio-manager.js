/*
    global $ Engine
*/

/** @class
 * @classdesc An utility class which improves audio for JS apps. Extends audio capabilities and handles features such as global volume, mute, ...
 */
Engine.prototype.AudioManager = new function() {
    var self = this;
    this.globalVolume = 1;
    this.playing = [];
    this.muted = false;

    // Adds a function to the Audio prototype to fade the volume to a given value in a given duration.
    Audio.prototype.fadeTo = function(targetVolume, duration) {
        $(this).animate({volume: targetVolume}, duration);
    };

    /** Sets the volume of all sounds (will be applied to the sounds that are played later).
     * @param {Number} volume - The volume value, between 0 and 1.
     */
    this.setGlobalVolume = function(volume) {
        this.globalVolume = volume;
        for(var i = 0; i < this.playing.length; i++)
            this.playing[0].volume = this.globalVolume;
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

    /** Toggles mute for all audio. */
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
