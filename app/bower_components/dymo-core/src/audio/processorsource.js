/**
 * A source that allows realtime time stretching.
 * @constructor
 */
function AudioProcessorSource(audioContext, buffer, destination) {
	
	var self = this;
	
	var soundTouch = new SoundTouch(buffer.sampleRate);
	
	this.stretchRatio = {
		setValue:function(value) {
			soundTouch.tempo = value;
		},
		getValue:function() {
			return soundTouch.tempo;
		}
	};
	this.playbackRate = {
		setValue:function(value) {
			soundTouch.rate = value;
		},
		getValue:function() {
			return soundTouch.rate;
		}
	};
	
	var BUFFER_SIZE = 1024;
	
	var source = {
		extract: function (target, numFrames, position) {
			var channels = [];
			for (var i = 0; i < buffer.numberOfChannels; i++) {
				channels.push(buffer.getChannelData(i));
			}
			for (var i = 0; i < numFrames; i++) {
				for (var j = 0; j < channels.length; j++) {
					target[i * channels.length + (j % channels.length)] = channels[j][i + position];
				}
			}
			return Math.min(numFrames, channels[0].length - position);
		}
	};
	
	var f = new SimpleFilter(source, soundTouch);
	
	var node = audioContext.createScriptProcessor(BUFFER_SIZE, 2, buffer.numberOfChannels);
	
	var samples = new Float32Array(BUFFER_SIZE * 2);
	
	node.onaudioprocess = function (e) {
		var channels = [];
		for (var i = 0; i < buffer.numberOfChannels; i++) {
			channels.push(e.outputBuffer.getChannelData(i));
		}
		var framesExtracted = f.extract(samples, BUFFER_SIZE);
		if (framesExtracted == 0) {
			self.stop();
		}
		for (var i = 0; i < framesExtracted; i++) {
			for (var j = 0; j < channels.length; j++) {
				channels[j][i] = samples[i * channels.length + (j % channels.length)];
			}
		}
	};

	this.start = function(delay) {
		setTimeout(function(){
			node.connect(destination);
		}, delay);
	}
	
	this.stop = function() {
		node.disconnect();
	}

}