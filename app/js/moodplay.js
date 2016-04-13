  //client width & client height
var cw;
var ch;
//var start = false;
var clicked = false;
//
var xclick;
var yclick;

var textLength;

var limits;

var configNumber = 4;
var MOOD_URI = "http://localhost:8070/";
var DYMO_URI = "http://localhost:8090/";
var AUDIO_URI = "http://localhost:8060/";
var LIMITS_SERVICE = "coordinateLimits";
var COORD_SERVICE = "findNearestTracks";
var AUDIO_SERVICE = "loadAudioFile";
var AUDIO_BASE_URI = "http://localhost/ilmaudio/mp3/"

var MB_URI = "http://musicbrainz.org/ws/2/recording/";

var context;
var fadeTime = 4;
var offset = 30;
var duration = 60;

//dymo stuff
var dymoManager;
var fadePosition = 0;
var isPlaying = false;

var Application = {
  moods : [
	['pathetic',0.12,0.27,0,0],
	['dark',0.12,0.38,0,0],
	['apocalyptic',0.12,0.49,0,0],
	['harsh',0.04,0.63,0,0],
	['terror',0.02,0.56,0,0],
	['depressive',0.21,0.20,0,0],
	['cold',0.32,0.40,0,0],
	['scary',0.22,0.69,0,0],
	['melancholy',0.38,0.11,0,0],
	['sad',0.41,0.09,0,0],
	['deep',0.46,0.24,0,0],
	['haunting',0.35,0.26,0,0],
	['neutral',0.5,0.5,0,0],
	['angry',0.36,0.78,0,0],
	['brutal',0.26,0.90,0,0],
	['slow',0.54,0.10,0,0],
	['dreamy',0.50,0.16,0,0],
	['epic',0.54,0.33,0,0],
	['nostalgia',0.60,0.23,0,0],
	['pure',0.58,0.38,0,0],
	['free',0.60,0.43,0,0],
	['sexy',0.60,0.57,0,0],
	['quirky',0.63,0.77,0,0],
	['chill',0.71,0.00,0,0],
	['mellow',0.68,0.09,0,0],
	['soft',0.74,0.18,0,0],
	['smooth',0.82,0.21,0,0],
	['sweet',0.75,0.36,0,0],
	['pleasure',0.80,0.46,0,0],
	['party',0.825,0.8,0,0],
	['energetic',0.73,0.65,0,0],
	['fun',0.83,0.68,0,0],
	['humour',0.77,0.79,0,0],
	['laid back',0.86,0.14,0,0],
	['easy',0.95,0.22,0,0],
	['soulful',0.94,0.27,0,0],
	['uplifting',0.90,0.44,0,0],
	['happy',0.92,0.52,0,0],
	['upbeat',0.91,0.55,0,0]
  ],
 
  init: function() {
    this.is_touch_device = 'ontouchstart' in document.documentElement;
    this.canvas = document.getElementById('canvas');
		cw = document.documentElement.clientWidth;  
		ch = document.documentElement.clientHeight-82;  
		this.canvas.width = cw;  
		this.canvas.height = ch;
    this.label = document.getElementById('label');
    this.draw();
    this.lastClick = new Date();

		window.onresize = function(){
			Application.init();
		}

    if (this.is_touch_device) {
      this.canvas.addEventListener('touchstart', function(event) {
        Application.onMouseUp(event.targetTouches[0]);
      });
    }
    else {
      this.canvas.addEventListener('click', function(event) {
        Application.onMouseUp(event);
      });
    }

    var uri = MOOD_URI + LIMITS_SERVICE + "?configNumber=" + configNumber;
    this.sendRequest(uri, this.processLimitsResponse);

    Application.playlist = Array();

    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    } catch(e) {
        throw new Error('Web Audio API not supported.');
    }

    dymoManager = new DymoManager(context, 2);
    dymoManager.loadDymoAndRendering('data/mixdymo.json', 'data/rendering.json');
  },

  tl: { r: 200, g: 0, b: 0 },
  tr: { r: 200, g: 150, b: 0 },
  bl: { r: 0, g: 50, b: 100 },
  br: { r: 200, g: 230, b: 80 },
  
  interpolateColor: function(a, b, x) {
    return {
      r: Math.floor(a.r + (b.r - a.r) * x),
      g: Math.floor(a.g + (b.g - a.g) * x),
      b: Math.floor(a.b + (b.b - a.b) * x)
    };
  },

  draw: function() {
    var xstep = cw/50;
    var ystep = ch/50;
    var ctx = this.canvas.getContext("2d");  
    ctx.clearRect(0, 0, cw, ch);

    var list = [];

   	for (var y = 0; y < ch; y += ystep) {
	      var left = this.interpolateColor(this.tl, this.bl, y/ch);
	      var right = this.interpolateColor(this.tr, this.br, y/ch);
	      for (var x = 0; x < cw; x += xstep) {
	        var color = this.interpolateColor(left, right, x/cw);
	        ctx.fillStyle = "rgb(" + color.r + "," + color.g + "," + color.b + ")";
	        ctx.fillRect(x, y, xstep+1, ystep+1);
	      }
    }

    if (this.marker) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.arc(this.marker.x, this.marker.y, 20, 0, Math.PI*2, true); 
      ctx.fill();
      //ctx.translate(this.marker.x, this.marker.y);
       ctx.save();
	  ctx.font = "16px Arial";
	  ctx.textAlign = 'center';
	  ctx.fillStyle = "rgb(255,255,255)";
		
	  textLength = ctx.measureText(this.marker.title);
	  //alertify.log(this.marker.x+' '+textLength.width);
	if( this.marker.y <ch/2)    {
	  	if( this.marker.x < textLength.width/2) {
			  ctx.fillText(this.marker.title,this.marker.x+textLength.width/2,this.marker.y+35);
			                 }
		else if( this.marker.x > cw-textLength.width/2) {
			  ctx.fillText(this.marker.title,this.marker.x-textLength.width/2,this.marker.y+35);
				                 }
		
		else{
		ctx.fillText(this.marker.title,this.marker.x,this.marker.y+35);
	           }
	                                 }
	  else{
		if( this.marker.x < textLength.width/2) {
			 ctx.fillText(this.marker.title,this.marker.x+textLength.width/2,this.marker.y-25);
				
			                 }
		else if( this.marker.x > cw-textLength.width/2) {
			 ctx.fillText(this.marker.title,this.marker.x-textLength.width/2,this.marker.y-25);
							}
		else{
	    ctx.fillText(this.marker.title,this.marker.x ,this.marker.y-25);
		}
	 }
	
	 ctx.restore();	
  }
},
    
  sendRequest: function(uri, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', uri, true); 
    request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    request.onreadystatechange = function() {
        if(request.readyState == 4) {
            if(request.status == 200) {
                callback(request.responseText);
            } else {
                alert("Query error: " + request.status + " " + request.responseText);
            }
        }
    };
    request.send(null);
  },

  processLimitsResponse: function(json) {
    var dict = jQuery.parseJSON(json);
    limits = {};
    limits.vmin = parseFloat(dict[0].vmin.value);
    limits.vmax = parseFloat(dict[0].vmax.value);
    limits.amin = parseFloat(dict[0].amin.value);
    limits.amax = parseFloat(dict[0].amax.value);
  },

  processMoodResponse: function(json) {
    var dict = jQuery.parseJSON(json);
    var mbid = dict[0].mbid.value;
    var path = dict[0].path.value;
    Application.sendRequest(MB_URI + mbid + "?inc=artist-credits&fmt=json", Application.processMBResponse);
    var uri = path; //AUDIO_BASE_URI + path.replace(".wav", ".mp3");
    Application.sendRequest(DYMO_URI + "getDymoForFilename?filename=" + path + "&uri=" + uri, Application.processDymoResponse);
   // Application.processAudioResponse(dymo);
  },

  processDymoResponse: function(dymo) {
    dymoManager.loadDymoFromJson(JSON.parse(dymo), function(nextSongDymo) {
      var currentSongDymo = dymoManager.getTopDymo().getPart(fadePosition);
      fadePosition = 1-fadePosition;
      dymoManager.getTopDymo().replacePart(fadePosition, nextSongDymo);
      //sync the loaded dymos to be in the same metrical position
      var currentBeat = 0;
      if (currentSongDymo) {
        var currentBar = currentSongDymo.getPart(currentSongDymo.getNavigator().getPartsPlayed());
        currentBeat = currentBar.getNavigator().getPartsPlayed();
      }
      nextSongDymo.getPart(0).getNavigator().setPartsPlayed(currentBeat+1);
      setTimeout(function() {
        if (!isPlaying) {
          dymoManager.startPlaying();
          isPlaying = true;
        }
        dymoManager.getUIControl("transition").update();
      }, 500);
    });
  },

  processAudioResponse: function(fileuri) {
    AudioPlayer.loadTrack(fileuri);
  },

  processMBResponse: function(json) {
    var dict = jQuery.parseJSON(json);
    var title = dict.title;
    var artist = dict['artist-credit'][0].artist.name;
    Application.showMetadata(title, artist);
  },

  onMouseUp: function(event) {
//  	if(!start)
  //		return;
  	if(!clicked)
  		clicked = true;
    //if ((new Date() - this.lastClick) > 1000) {
    this.setMarker(event);
	 	xclick = event.pageX;
		yclick = event.pageY;
      //this.sendPosition(event);
    this.draw();
    //this.lastClick = new Date();
    //}
  },

  sendSPARQLQuery: function(event) {
    if(!clicked)
      return;
    Application.clear();
    var x = xclick / cw;
    var y = 1 - yclick / ch;
    var v = Application.linlin(x, 0.0, 1.0, limits.vmin, limits.vmax);
    var a = Application.linlin(y, 0.0, 1.0, limits.amin, limits.amax);
    var uri = MOOD_URI + COORD_SERVICE + "?valence=" + v + "&arousal=" + a + "&limit=1";
    this.sendRequest(uri, this.processMoodResponse);
  },

  linlin: function(val, inmin, inmax, outmin, outmax) {
    if (val <= inmin) return outmin;
    if (val >= inmax) return outmax;
    return (val - inmin) / (inmax-inmin) * (outmax-outmin) + outmin;
  },

  setMarker: function(event) {
    this.marker = {
      x: event.pageX,
      y: event.pageY,
	  title: 'null'
    };

    var x = event.pageX / cw;
    var y = 1 - event.pageY / ch;

    this.label.innerHTML = 'Click to send';
	  this.marker.title = this.findMood(x, y);
  },

  findMood: function(x, y) {
    var distance = 1;
    var index = null;
    
    for (var i = 0; i < this.moods.length; i++) {
      var mood = this.moods[i];
      var dx = Math.abs(mood[1] - x);
      var dy = Math.abs(mood[2] - y);
      var d = Math.sqrt(dx * dx + dy * dy);

      if (d < distance) {
        distance = d;
        index = i;
      }
    }

    return this.moods[index][0];
  },

  clear: function() {
      $("#filename").text("");  
      $("#title").text("");
      $("#artist").text("");
  },

  fadeTrack: function(path) {
      $("#filename").text(path);
  },

  showMetadata: function(title, artist) {
      $("#title").text(title);
      $("#artist").text(artist);
  }


};

var AudioPlayer = {
  init: function() {
    AudioPlayer.enabled = true;
    AudioPlayer.current = null;
    AudioPlayer.tracks = {};
  },

  loadTrack: function(filename) {
    var request = new XMLHttpRequest();
    request.open('GET', filename, true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
      context.decodeAudioData(request.response, function(buffer) {
        if (AudioPlayer.enabled) { 
          track = { "filename": filename };
          Application.playlist.push(track);
          AudioPlayer.createSource(buffer, filename);
        }
      }, function(err) {
        throw new Error(err);
      });
    }

    request.send();
  },

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
    if (AudioPlayer.current != null)
    {
      AudioPlayer.crossFadeTracks(AudioPlayer.current, track);
    }
    else
    {
      AudioPlayer.fadeInTrack(track); 
    }
  },

  crossFadeTracks: function(trackOut, trackIn) {
    trackOut.gainNode.gain.linearRampToValueAtTime(1.0, context.currentTime);
    trackOut.gainNode.gain.linearRampToValueAtTime(0.0, context.currentTime + fadeTime);

    trackIn.gainNode.gain.linearRampToValueAtTime(0.0, context.currentTime);
    trackIn.gainNode.gain.linearRampToValueAtTime(1.0, context.currentTime + fadeTime);

    AudioPlayer.current = trackIn;

  },

  fadeInTrack: function (track) {
    track.gainNode.gain.linearRampToValueAtTime(0.0, context.currentTime);
    track.gainNode.gain.linearRampToValueAtTime(1.0, context.currentTime + fadeTime);    

    AudioPlayer.current = track;
  }

}