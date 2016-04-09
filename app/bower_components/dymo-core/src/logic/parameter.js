/**
 * A parameter that has updaters and observers.
 * @param {boolean=} isInteger (optional)
 * @constructor
 */
function Parameter(name, initialValue, isInteger) {
	
	var self = this;
	var value = initialValue;
	var change = 0; //records amount of last change
	var updaters = [];
	var observers = [];
	
	this.getName = function() {
		return name;
	}
	
	this.getValue = function() {
		return value;
	}
	
	this.getChange = function() {
		return change;
	}
	
	this.addUpdater = function(updater) {
		if (updaters.indexOf(updater) < 0) {
			updaters.push(updater);
			updater.updatedParameterChanged(value);
		}
	}
	
	this.removeUpdater = function(updater) {
		var i = updaters.indexOf(updater);
		if (i > -1) {
			updaters.splice(i, 1);
		}
	}
	
	this.addObserver = function(observer) {
		observers.push(observer);
	}
	
	this.removeObserver = function(observer) {
		var i = observers.indexOf(observer);
		if (i > -1) {
			observers.splice(i, 1);
		}
	}
	
	this.getObservers = function() {
		return observers;
	}
	
	this.update = function(newValue, updater) {
		setValueAndNotify(updater, newValue);
	}
	
	this.relativeUpdate = function(newChange, updater) {
		this.update(value+newChange, updater);
	}
	
	function notifyObservers() {
		for (var i = 0; i < observers.length; i++) {
			observers[i].observedParameterChanged(self);
		}
	}
	
	function setValueAndNotify(updater, newValue) {
		if (!isNaN(newValue)) {
			if (isInteger) {
				newValue = Math.round(newValue);
			}
			if (Math.abs(newValue - value) > 0.000001) { //catch floating point errors
				change = newValue - value;
				value = newValue;
				//update values of all other updaters connected to this parameter
				for (var i = 0; i < updaters.length; i++) {
					if (updaters[i] != updater) {
						updaters[i].updatedParameterChanged(value);
					}
				}
				//only notify if value changed
				if (change) {
					notifyObservers();
				}
			}
		}
	}
	
	//returns the first value that it manages to request that is different from this.value
	//returns this.value if none are different
	this.requestValue = function() {
		for (var i = 0; i < updaters.length; i++) {
			var requestedValue = updaters[i].requestValue();
			if (requestedValue && requestedValue != value) {
				setValueAndNotify(updaters[i], requestedValue);
				return value;
			}
		}
		return value;
	}
	
}