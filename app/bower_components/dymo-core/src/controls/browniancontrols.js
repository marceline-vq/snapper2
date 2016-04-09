/**
 * Controls based on brownian motion
 * @constructor
 */
function BrownianControls() {
	
	var self = this;
	
	var parameters = {};
	parameters[BROWNIAN_FREQUENCY] = new Parameter(BROWNIAN_FREQUENCY, 100);
	parameters[BROWNIAN_FREQUENCY].addObserver(this);
	parameters[BROWNIAN_MAX_STEP_SIZE] = new Parameter(BROWNIAN_MAX_STEP_SIZE, 0.1);
	parameters[BROWNIAN_MAX_STEP_SIZE].addObserver(this);
	this.brownianControl = new Control(BROWNIAN, AUTO_CONTROL, parameters);
	this.brownianControl.update(0.5);
	var min = 0;
	var max = 1;
	var intervalID;
	
	startUpdate();
	
	function startUpdate() {
		intervalID = setInterval(function() {
			var currentMaxStepSize = parameters[BROWNIAN_MAX_STEP_SIZE].getValue();
			var currentStep = (2 * currentMaxStepSize * Math.random()) - currentMaxStepSize;
			var newValue = self.brownianControl.getValue() + currentStep;
			newValue = Math.min(Math.max(newValue, min), max);
			self.brownianControl.update(newValue);
		}, parameters[BROWNIAN_FREQUENCY].getValue());
	}
	
	this.getParameter = function(name) {
		return parameters[name];
	}
	
	this.observedParameterChanged = function(param) {
		if (param.getName() == BROWNIAN_FREQUENCY) {
			clearInterval(intervalID);
			startUpdate();
		}
	}
	
}