/**
 * Manages playing back any number of dymos.
 * @constructor
 */
function Scheduler(audioContext, onSourcesChange, onPlaybackChange) {
	
	var self = this;
	var SCHEDULE_AHEAD_TIME = 0.1; //seconds
	
	var dymoBasePath = '';
	var buffers = {};
	var sources = {}; //grouped by top dymo
	var nextSources = {}; //for each top dymo
	var endTimes = {};
	var previousOnsets = {};
	this.urisOfPlayingDymos = [];
	
	//horizontal listener orientation in degrees
	this.listenerOrientation = new Parameter(this, 0);
	
	var convolverSend = audioContext.createConvolver();
	convolverSend.connect(audioContext.destination);
	
	var numCurrentlyLoading = 0;
	var timeoutID;//TODO MAKE TIMEOUT IDS FOR EACH DMO!!!!!
	
	this.setReverbFile = function(filePath) {
		loadAudio(filePath, function(buffer) {
			convolverSend.buffer = buffer;
			sourceReady();
		});
	}
	
	this.setDymoBasePath = function(path) {
		dymoBasePath = path;
	}
	
	this.getDymoBasePath = function() {
		return dymoBasePath;
	}
	
	this.addSourceFile = function(filePath) {
		//only add if not there yet..
		if (!buffers[filePath]) {
			loadAudio(dymoBasePath+filePath, function(buffer) {
				buffers[filePath] = buffer;
				sourceReady();
			});
		}
	}
	
	this.getBuffer = function(dymo) {
		return buffers[dymo.getSourcePath()];
	}
	
	function sourceReady() {
		if (numCurrentlyLoading > 0) {
			numCurrentlyLoading--;
		}
		if (numCurrentlyLoading == 0 && onSourcesChange) {
			onSourcesChange(numCurrentlyLoading);
		}
	}
	
	this.play = function(dymo) {
		dymo.updatePartOrder(ONSET);
		internalPlay(dymo);
	}
	
	var deltaOnset = 0;
	
	function internalPlay(dymo) {
		var uri = dymo.getUri();
		var currentSources;
		if (!sources[uri]) {
			//create first source
			currentSources = createNextSources(dymo);
			sources[uri] = {};
			for (var i = 0; i < currentSources.length; i++) {
				var currentDymo = currentSources[i].getDymo();
				registerSource(uri, currentDymo.getUri(), currentSources[i]);
				previousOnsets[uri] = currentDymo.getParameter(ONSET).getValue();
				if (previousOnsets[uri] < 0) {
					deltaOnset = -1*previousOnsets[uri];
				}
			}
		} else {
			//switch to source
			currentSources = nextSources[uri];
			for (var i = 0; i < currentSources.length; i++) {
				registerSource(uri, currentSources[i].getDymo().getUri(), currentSources[i]);
			}
		}
		var delay;
		if (!endTimes[uri]) {
			delay = SCHEDULE_AHEAD_TIME;
		} else {
			delay = endTimes[uri]-audioContext.currentTime;
		}
		var startTime = audioContext.currentTime+delay;
		for (var i = 0; i < currentSources.length; i++) {
			currentSources[i].play(startTime);//, currentPausePosition); //% audioSource.loopEnd-audioSource.loopStart);
		}
		setTimeout(function() {
			var playingDymos = [];
			for (var i = 0; i < currentSources.length; i++) {
				playingDymos.push(currentSources[i].getDymo());
			}
			updatePlayingDymos(playingDymos);
		}, delay);
		var nextSrcs = createNextSources(dymo);
		if (nextSrcs) {
			nextSources[uri] = nextSrcs;
			//REALLY BAD QUICKFIX! REDESIGN!!!
			//TODO ACCOUNT FOR MAX DURATION OF PARALLEL SOURCES!!!!! instead currentSources[0].getDuration()
			var nextOnset = nextSrcs[0].getDymo().getParameter(ONSET).getValue();
			var timeToNextOnset = nextOnset-previousOnsets[uri];
			if (nextOnset != -1) { //JUST A QUICKFIX (-1 standard value), DEAL WITH ONSETS FOR REAL!! //&& !timeToNextOnset || timeToNextOnset < currentSources[0].getDuration()) {
				endTimes[uri] = startTime+timeToNextOnset;
				previousOnsets[uri] = nextOnset;
			} else {
				endTimes[uri] = startTime+(currentSources[0].getDuration()/currentSources[0].getDymo().getParameter(PLAYBACK_RATE).getValue());
			}
			if (endTimes[uri]) {
				//TODO MAKE TIMEOUT IDS FOR EACH DYMO!!!!!
				timeoutID = setTimeout(function() { internalPlay(dymo); }, (endTimes[uri]-audioContext.currentTime-SCHEDULE_AHEAD_TIME)*1000);
			}
		} else {
			endTimes[uri] = startTime+currentSources[0].getDuration()/currentSources[0].getDymo().getParameter(PLAYBACK_RATE).getValue();
			timeoutID = setTimeout(function() { reset(dymo); }, (endTimes[uri]-audioContext.currentTime)*1000);
		}
	}
	
	function registerSource(topUri, dymoUri, source) {
		sources[topUri][dymoUri] = source;
	}
	
	this.pause = function(dymo) {
		callOnSources(dymo, "pause");
	}
	
	this.stop = function(dymo) {
		callOnSources(dymo, "stop");
		reset(dymo);
	}
	
	function callOnSources(dymo, func) {
		var dymoSources = sources[dymo.getUri()];
		if (dymoSources) {
			for (var key in dymoSources) {
				dymoSources[key][func].call(dymoSources[key]);
			}
		}
	}
	
	function reset(dymo) {
		window.clearTimeout(timeoutID);
		var uri = dymo.getUri();
		sources[uri] = null;
		nextSources[uri] = null;
		endTimes[uri] = null;
		dymo.resetPartsPlayed();
		updatePlayingDymos([]);
	}
	
	function updatePlayingDymos(dymos) {
		var newDymos = [];
		for (var i = 0; i < dymos.length; i++) {
			var currentDymo = dymos[i];
			while (currentDymo != null) {
				if (newDymos.indexOf(currentDymo.getUri()) < 0) {
					newDymos.push(currentDymo.getUri());
				}
				currentDymo = currentDymo.getParent();
			}
		}
		self.urisOfPlayingDymos = newDymos;
		if (onPlaybackChange) {
			onPlaybackChange();
		}
	}
	
	this.getSources = function(dymo) {
		return sources[dymo.getUri()];
	}
	
	this.updateListenerOrientation = function() {
		var angleInRadians = this.listenerOrientation.value / 180 * Math.PI;
		audioContext.listener.setOrientation(Math.sin(angleInRadians), 0, -Math.cos(angleInRadians), 0, 1, 0);
	}
	
	function createNextSources(dymo) {
		var nextParts = dymo.getNextParts();
		if (nextParts) {
			var nextSources = [];
			for (var i = 0; i < nextParts.length; i++) {
				if (nextParts[i].getSourcePath()) {
					var buffer = buffers[nextParts[i].getSourcePath()];
					nextSources.push(new Source(nextParts[i], audioContext, buffer, convolverSend));
				}
			}
			return nextSources;
		}
	}
	
	function loadAudio(path, callback) {
		numCurrentlyLoading++;
		var request = new XMLHttpRequest();
		request.open('GET', path, true);
		request.responseType = 'arraybuffer';
		request.onload = function() {
			audioContext.decodeAudioData(request.response, function(buffer) {
				callback(buffer);
			});
		}
		request.send();
	}
	
}