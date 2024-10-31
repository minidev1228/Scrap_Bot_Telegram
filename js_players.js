var player = require('play-sound')(opts = {});

player.play('sound.mp3', function(err) {
    if (err) console.log("play-sound not working");
});

const sound = require("sound-play");
try {
    sound.play("sound.mp3");
} catch (err) {
    console.log("Sound-play doesnt work");
}

const player_wav = require('node-wav-player');
player_wav.play({
  path: 'sound.mp3',
}).then(() => {
  console.log('The wav file started to be played successfully.');
}).catch((error) => {
  console.error('node-wav-player doesnt work');
});