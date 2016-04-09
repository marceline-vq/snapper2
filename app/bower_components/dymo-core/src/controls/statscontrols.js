/**
 * Autocontrols that use statistics to set their values.
 * @constructor
 */
function StatsControls() {
	
	var self = this;
	
	var parameters = {};
	parameters[STATS_FREQUENCY] = new Parameter(STATS_FREQUENCY, 300);
	parameters[STATS_FREQUENCY].addObserver(this);
	this.randomControl = new Control(RANDOM, AUTO_CONTROL, parameters);
	var intervalID;
	
	startUpdate();
	
	function startUpdate() {
		intervalID = setInterval(function() {
			self.randomControl.update(Math.random());
		}, parameters[STATS_FREQUENCY].getValue());
	}
	
	this.getParameter = function(name) {
		return parameters[name];
	}
	
	this.observedParameterChanged = function(param) {
		if (param.getName() == STATS_FREQUENCY) {
			clearInterval(intervalID);
			startUpdate();
		}
	}
	
}