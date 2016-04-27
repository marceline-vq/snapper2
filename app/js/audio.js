var offset = 30;
var fadeTime = 4;
var duration = 60;
var track;

// initialising the AudioPlayer
var AudioPlayer = {
  init: function() {
    AudioPlayer.enabled = true;
    AudioPlayer.current = null;
    AudioPlayer.tracks = {};
  },
  // adding the track to the playlist and calling the function to play it
  loadTrack: function(filename) {
    var request = new XMLHttpRequest();
    request.open('GET', filename, true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
      context.decodeAudioData(request.response, function(buffer) {
        if (AudioPlayer.enabled) { 
          track = { "filename": filename };
          myMoodplay.playlist.push(track);
          AudioPlayer.createSource(buffer, filename);
        }
      }, function(err) {
        throw new Error(err);
      });
    }
    request.send();
  },
  // function to start playing the corresponding track from Moodplay
  createSource: function(buffer, filename) {
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    var track = { "buffer": buffer, "source": source, "filename": filename};
    track.gainNode = context.createGain();
    source.connect(track.gainNode);
    track.gainNode.gain.value = 0.0;
    track.gainNode.connect(context.destination);
    AudioPlayer.tracks[filename] = track;
    track.source.start(0.0, offset, duration);    
    if (AudioPlayer.current != null){
      AudioPlayer.crossFadeTracks(AudioPlayer.current, track);
    }
    else{
      AudioPlayer.fadeInTrack(track); 
    }
  },
  // crossfading between two tracks
  crossFadeTracks: function(trackOut, trackIn) {
    AudioPlayer.current = trackIn;
    
    trackOut.gainNode.gain.linearRampToValueAtTime(1.0, context.currentTime);
    trackOut.gainNode.gain.linearRampToValueAtTime(0.0, context.currentTime + fadeTime);

    trackIn.gainNode.gain.linearRampToValueAtTime(0.0, context.currentTime);
    trackIn.gainNode.gain.linearRampToValueAtTime(1.0, context.currentTime + fadeTime);

  },
  // fading in a new track
  fadeInTrack: function (track) {
    track.gainNode.gain.linearRampToValueAtTime(0.0, context.currentTime);
    track.gainNode.gain.linearRampToValueAtTime(1.0, context.currentTime + fadeTime);    

    AudioPlayer.current = track;
  }

}