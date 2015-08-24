var play = require('play-audio')();
var ipc = window.require('ipc');

play.on('canplay', function() {
	play.play();
})

ipc.on('audio-src', function(src) {
	play.src(src);
});

ipc.on('audio-play', function() {
	play.play();
});

ipc.on('audio-pause', function() {
	play.pause();
});

play.on('ended', function() {
	ipc.send('audio-ended');
})

module.exports = play;
