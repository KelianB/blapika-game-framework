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

    Audio.prototype.fadeTo = function(targetVolume, duration) {
        $(this).animate({volume: targetVolume}, duration);
    };

    this.setGlobalVolume = function(volume) {
        this.globalVolume = volume;
        for(var i = 0; i < this.playing.length; i++) {
            this.playing[0].volume = this.globalVolume;
        }
    };

    this.playRepeatable = function(audio, fadeIn) {
        this.play(audio.cloneNode(), false, fadeIn);
    };

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

    // If count is undefined => loop indefinitively
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

    this.toggleMute = function() {
        this.muted = !this.muted;

        for(var i = 0; i < this.playing.length; i++)
            this.playing[i].muted = this.muted;
    };

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
