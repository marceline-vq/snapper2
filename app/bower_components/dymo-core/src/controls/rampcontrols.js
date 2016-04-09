/**
 * Ramp controls that gradually interpolate between given values.
 * @constructor
 */
function RampControls() {
	
	var self = this;
	this.frequency = 100;
	this.duration = 10000;
	var currentValue = 0;
	var isIncreasing = true;
	
	var parameters = {};
	parameters[RAMP_TRIGGER] = new Parameter(RAMP_TRIGGER, 0);
	parameters[RAMP_TRIGGER].addObserver(this);
	this.linearRampControl = new Control(RAMP, AUTO_CONTROL, parameters);
	var intervalID;
	
	function startUpdate() {
		intervalID = setInterval(function() {
			var delta = 1/self.duration*self.frequency;
			if (!isIncreasing) {
				delta *= -1;
			}
			currentValue += delta;
			if (0 < currentValue && currentValue < 1) {
				self.linearRampControl.update(currentValue);
			} else if (currentValue >= 1) {
				self.linearRampControl.update(1);
				reset();
			} else if (currentValue <= 0) {
				self.linearRampControl.update(0);
				reset();
			}
		}, self.frequency);
	}
	
	function reset() {
		clearInterval(intervalID);
		intervalID = undefined;
		isIncreasing = !isIncreasing;
	}
	
	this.getParameter = function(name) {
		return parameters[name];
	}
	
	this.observedParameterChanged = function(param) {
		if (param.getName() == RAMP_TRIGGER) {
			if (!intervalID) {
				startUpdate();
			} else {
				reset();
			}
		}
	}
	
}