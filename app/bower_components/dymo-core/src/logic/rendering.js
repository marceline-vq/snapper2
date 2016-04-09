/**
 * A rendering defines how a given dymo is played back.
 * @constructor
 */
function Rendering(dymo) {
	
	var self = this;
	
	var mappings = [];
	
	this.play = function() {
		if (dymo) {
			dymo.getParameter(PLAY).update(1);
		}
	}
	
	this.stop = function() {
		if (dymo) {
			dymo.getParameter(PLAY).update(0);
		}
	}
	
	this.addMapping = function(mapping) {
		mappings.push(mapping);
		mapping.updateParameter();
	}
	
	this.getMappings = function() {
		return mappings;
	}
	
	this.toJson = function() {
		var json = {"mappings":[]};
		if (dymo) {
			json["topDymo"] = dymo.getUri();
		}
		for (var i = 0; i < mappings.length; i++) {
			json["mappings"].push(mappings[i].toJson());
		}
		return json;
	}

}
