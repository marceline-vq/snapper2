/**
 * A navigator that follows similarity relations.
 * @constructor
 */
function SimilarityNavigator(dymo) {
	
	var self = this;
	
	var isPlaying = false;
	var partsPlayed = 0;
	
	this.leapingProbability = new Parameter(LEAPING_PROBABILITY, 0.5);
	//if true the control continues after the part index leaped to
	//if false it stays on the general timeline and merely replaces parts according to the graph
	this.continueAfterLeaping = new Parameter(CONTINUE_AFTER_LEAPING, 0, true);
	
	this.resetPartsPlayed = function() {
		partsPlayed = 0;
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
					replaceWithSimilars(parallelParts);
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
						replaceWithSimilars(nextParts);
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
	
	function replaceWithSimilars(parts) {
		for (var i = 0; i < parts.length; i++) {
			if (parts[i].getSimilars().length > 0) {
				if (Math.random() < self.leapingProbability.getValue()) {
					var options = parts[i].getSimilars();
					var selectedOption = Math.floor(Math.random()*options.length);
					if (self.continueAfterLeaping.getValue()) {
						var index = dymo.getParts().indexOf(selectedOption);
						if (index) {
							partsPlayed = index+1;
						}
					}
					parts[i] = options[selectedOption];
				}
			}
		}
	}
	
}