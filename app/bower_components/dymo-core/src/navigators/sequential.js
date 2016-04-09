/**
 * A navigator that follows the order of parts.
 * @constructor
 */
function SequentialNavigator(dymo) {
	
	var isPlaying = false;
	var partsPlayed = 0;
	
	this.resetPartsPlayed = function() {
		partsPlayed = 0;
	}
	
	this.setPartsPlayed = function(played) {
		partsPlayed = played;
	}
	
	this.getPartsPlayed = function() {
		return partsPlayed;
	}
	
	this.getNextParts = function() {
		var parts = dymo.getParts();
		if (parts.length > 0) {
			if (dymo.getType() == PARALLEL) {
				var parallelParts = [];
				for (var i = 0; i < parts.length; i++) {
					var nextParts = parts[i].getNextParts();
					if (nextParts && (!nextParts.length || nextParts.length > 0)) {
						parallelParts = parallelParts.concat(nextParts);
					}
				}
				if (parallelParts.length > 0) {
					console.log(parallelParts.map(function(d){return d.getIndex();}))
					return parallelParts;
				}
			} else { //SEQUENTIAL FOR EVERYTHING ELSE
				isPlaying = true;
				while (partsPlayed < parts.length && partsPlayed < dymo.getParameter(PART_COUNT).getValue()) {
					var nextParts = parts[partsPlayed].getNextParts();
					if (nextParts && (!nextParts.length || nextParts.length > 0)) {
						if (!(nextParts instanceof Array)) {
							nextParts = [nextParts];
						}
						return nextParts;
					} else {
						partsPlayed++;
					}
				}
			}
			//done playing
			partsPlayed = 0;
			isPlaying = false;
			return null;
		} else {
			if (!isPlaying) {
				isPlaying = true;
				return [dymo];
			} else {
				isPlaying = false;
				return null;
			}
		}
	}
	
}