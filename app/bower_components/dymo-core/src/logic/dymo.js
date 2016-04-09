/**
 * A dymo has features, parameters, and parts.
 * @constructor
 */
function DynamicMusicObject(uri, scheduler, type) {
	
	var self = this;
	
	var parent = null;
	var parts = [];
	var similars = [];
	var features = {};
	var parameters = {};
	var mappings = [];
	var parentMappings = []; //mappings from parent to this dymo
	var isPlaying = false;
	var sourcePath;
	var skipProportionAdjustment = false;
	var previousIndex = null;
	initFeaturesAndParameters();
	var navigator = new SequentialNavigator(this);
	
	function initFeaturesAndParameters() {
		parameters[PLAY] = new Parameter(PLAY, 0, true);
		parameters[LOOP] = new Parameter(LOOP, 0, true);
		parameters[ONSET] = new Parameter(ONSET, -1);
		parameters[DURATION_RATIO] = new Parameter(DURATION_RATIO, 1);
		parameters[AMPLITUDE] = new Parameter(AMPLITUDE, 1);
		parameters[PLAYBACK_RATE] = new Parameter(PLAYBACK_RATE, 1);
		parameters[TIME_STRETCH_RATIO] = new Parameter(TIME_STRETCH_RATIO, 1);
		parameters[PAN] = new Parameter(PAN, 0);
		parameters[DISTANCE] = new Parameter(DISTANCE, 0);
		parameters[HEIGHT] = new Parameter(HEIGHT, 0);
		parameters[REVERB] = new Parameter(REVERB, 0);
		parameters[FILTER] = new Parameter(FILTER, 0);
		parameters[PART_INDEX] = new Parameter(PART_INDEX, 0, true);
		parameters[PART_COUNT] = new Parameter(PART_COUNT, Number.POSITIVE_INFINITY, true);
		parameters[PLAY].addObserver(self);
		parameters[PART_INDEX].addObserver(self);
		parameters[PART_COUNT].addObserver(self);
	}
	
	this.setType = function(t) {
		type = t;
	}
	
	this.getType = function() {
		return type;
	}
	
	this.getUri = function() {
		return uri;
	}
	
	this.setParent = function(dymo) {
		parent = dymo;
		for (var name in parameters) {
			if (name != PLAY && name != PART_COUNT && name != PART_INDEX) {
				//create standard relative mappings to child parameters
				parentMappings.push(new Mapping([dymo.getParameter(name)], true, undefined, [this], name));
			}
		}
		//add all appropriate subdymos to the parent's mappings
		var additionalMappings = parent.getMappings();
		var dymoMap = this.getDymoMap();
		dymoMap = Object.keys(dymoMap).map(function(key) { return dymoMap[key]; });
		for (var i = 0; i < additionalMappings.length; i++) {
			var dymoConstraint = additionalMappings[i].getDymoConstraint();
			if (dymoConstraint) {
				var newTargets = additionalMappings[i].getTargets().concat(dymoMap.filter(dymoConstraint));
				additionalMappings[i].setTargets(newTargets);
			}
		}
	}
	
	this.removeParent = function() {
		for (var i = 0; i < parentMappings.length; i++) {
			parentMappings[i].disconnect();
		}
		parentMappings = [];
		//remove all subdymos this from the parent's mappings (assumes that all mapping targets are dymos)
		var additionalMappings = parent.getMappings();
		var thisDymo = this;
		for (var i = 0; i < additionalMappings.length; i++) {
			var targets = additionalMappings[i].getTargets();
			targets = targets.filter(function(d) { return !d.isSubDymoOf(thisDymo); });
			additionalMappings[i].setTargets(targets);
		}
		parent = null;
	}
	
	this.getParent = function() {
		return parent;
	}
	
	//returns true if this appears in the sub-structure of the given dymo
	this.isSubDymoOf = function(dymo) {
		var currentDymo = this;
		while (currentDymo) {
			if (currentDymo == dymo) {
				return true;
			}
			currentDymo = currentDymo.getParent();
		}
		return false;
	}
	
	this.getDymoMap = function() {
		var dymoMap = {};
		recursiveAddToDymoMap(this, dymoMap);
		return dymoMap;
	}
	
	function recursiveAddToDymoMap(dymo, dymoMap) {
		dymoMap[dymo.getUri()] = dymo;
		for (var i = 0; i < dymo.getParts().length; i++) {
			recursiveAddToDymoMap(dymo.getParts()[i], dymoMap);
		}
	}
	
	this.getLevel = function() {
		if (parent) {
			return parent.getLevel()+1;
		}
		return 0;
	}
	
	this.getIndex = function() {
		if (parent) {
			return parent.getParts().indexOf(this);
		}
	}
	
	this.addPart = function(dymo) {
		parts.push(dymo);
		dymo.setParent(this);
	}
	
	this.removePart = function(dymo) {
		parts.splice(parts.indexOf(dymo));
		dymo.removeParent(this);
	}
	
	this.replacePart = function(index, dymo) {
		if (parts[index]) {
			parts[index].removeParent(this);
		}
		parts[index] = dymo;
		dymo.setParent(this);
	}
	
	this.getPart = function(index) {
		return parts[index];
	}
	
	this.getParts = function() {
		return parts;
	}
	
	this.getNthPart = function(n, level) {
		return recursiveGetNthPart(n, 0, level, this);
	}
	
	function recursiveGetNthPart(n, found, level, dymo) {
		var partsToGo = n-found;
		var currentParts = dymo.getParts();
		if (dymo.getLevel() == level && partsToGo == 0) {
			return dymo;
		} else if (dymo.getLevel() >= level-1) {
			if (partsToGo < currentParts.length) {
				return currentParts[partsToGo];
			}
			return found+currentParts.length;
		} else {
			for (var i = 0; i < currentParts.length; i++) {
				found = recursiveGetNthPart(n, found, level, currentParts[i]);
				if (isNaN(found)) {
					return found;
				}
			}
		}
	}
	
	this.setSourcePath = function(path) {
		sourcePath = path;
		if (path && scheduler) {
			scheduler.addSourceFile(path);
		}
	}
	
	this.getSourcePath = function() {
		if (parent && !sourcePath) {
			return parent.getSourcePath();
		}
		return sourcePath;
	}
	
	this.addSimilar = function(dymo) {
		similars.push(dymo);
	}
	
	this.getSimilars = function(dymo) {
		return similars;
	}
	
	this.getFeatures = function() {
		return features;
	}
	
	this.setFeature = function(name, value) {
		features[name] = value;
	}
	
	this.getFeature = function(name) {
		if (name === LEVEL) {
			return this.getLevel();
		} else if (name === INDEX) {
			return this.getIndex();
		} else if (features.hasOwnProperty(name)) {
			return features[name];
		} else if (parent) {
			return parent.getFeature(name);
		//may seem weird but helps a lot for now
		} else {
			var partFeatures = [];
			for (var i = 0; i < parts.length; i++) {
				if (parts[i]) {
					var currentPartFeature = parts[i].getFeatureWithoutLookingFurther(name);
					if (!isNaN(currentPartFeature)) {
						partFeatures.push(currentPartFeature);
					}
				}
			}
			if (partFeatures.length > 0) {
				return partFeatures;
			}
		}
	}
	
	this.getFeatureWithoutLookingFurther = function(name) {
		if (features[name]) {
			return features[name];
		}
	}
	
	this.getMappings = function() {
		return mappings;
	}
	
	this.getSegment = function() {
		return [this.getFeature("time"), parameters[DURATION_RATIO].getValue()*this.getFeature("duration")];
	}
	
	this.addParameter = function(parameter) {
		parameters[parameter.getName()] = parameter;
	}
	
	this.getParameter = function(parameterName) {
		if (parameterName == LISTENER_ORIENTATION) {
			return scheduler.listenerOrientation;
		} else if (parameterName == PART_ORDER) {
			return undefined;//this.updatePartOrder(feature.name);
		}
		return parameters[parameterName];
	}
	
	this.addMapping = function(mapping) {
		mappings.push(mapping);
	}
	
	this.observedParameterChanged = function(param) {
		//HMMM a little weird, think about this..
		if (param.getName() == PLAY) {
			if (param.getChange() > 0) {
				scheduler.play(self);
			} else {
				scheduler.stop(self);
			}
		}
	}
	
	this.setNavigator = function(nav) {
		navigator = nav;
	}
	
	this.getNavigator = function() {
		return navigator;
	}
	
	this.resetPartsPlayed = function() {
		navigator.resetPartsPlayed();
		for (var i = 0; i < parts.length; i++) {
			parts[i].resetPartsPlayed();
		}
	}
	
	this.updatePartOrder = function(featureOrParameterName) {
		if (parts && parts[0] && !isNaN(parts[0].getFeature(featureOrParameterName))) {
			parts.sort(function(p,q) {
				return p.getFeature(featureOrParameterName) - q.getFeature(featureOrParameterName);
			});
		} else if (parts) {
			parts.sort(function(p,q) {
				return p.getParameter(featureOrParameterName).getValue() - q.getParameter(featureOrParameterName).getValue();
			});
		}
	}
	
	this.getNextParts = function() {
		var nextP = navigator.getNextParts();
		return nextP;
	}
	
	//creates a hierarchical json of this (recursively containing parts)
	this.toJsonHierarchy = function() {
		var jsonDymo = this.toFlatJson();
		for (var i = 0; i < parts.length; i++) {
			jsonDymo["parts"].push(parts[i].toJsonHierarchy());
		}
		return jsonDymo;
	}
	
	this.toJsonHierarchyGraph = function() {
		var graph = createGraph();
		addToJsonHierarchyGraph(graph, this);
		return graph;
	}
	
	/** @param {Object=} parentJson (optional) */
	function addToJsonHierarchyGraph(graph, dymo, parentJson) {
		var currentJson = dymo.toFlatJson();
		graph["nodes"].push(currentJson);
		if (parentJson) {
			graph["links"].push(createLink(parentJson, currentJson));
		}
		for (var i = 0; i < dymo.getParts().length; i++) {
			addToJsonHierarchyGraph(graph, dymo.getParts()[i], currentJson);
		}
	}
	
	this.toJsonSimilarityGraph = function() {
		var graph = createGraph();
		addToJsonSimilarityGraph(graph, this);
		return graph;
	}
	
	//for now adds two edges per relation.
	/** @param {Object=} jsonMap (optional) */
	function addToJsonSimilarityGraph(graph, dymo, jsonMap) {
		if (!jsonMap) {
			jsonMap = {};
		}
		if (!jsonMap[dymo.getUri()]) {
			jsonMap[dymo.getUri()] = dymo.toFlatJson();
		}
		var currentJson = jsonMap[dymo.getUri()];
		graph["nodes"].push(currentJson);
		for (var i = 0; i < dymo.getSimilars().length; i++) {
			var currentSimilar = dymo.getSimilars()[i];
			if (!jsonMap[currentSimilar.getUri()]) {
				jsonMap[currentSimilar.getUri()] = currentSimilar.toFlatJson();
			}
			graph["links"].push(createLink(currentJson, jsonMap[currentSimilar.getUri()]));
		}
		for (var i = 0; i < dymo.getParts().length; i++) {
			addToJsonSimilarityGraph(graph, dymo.getParts()[i], jsonMap);
		}
	}
	
	function createGraph() {
		return {"nodes":[], "links":[]};
	}
	
	function createLink(dymo1, dymo2) {
		return {"source":dymo1, "target":dymo2, "value":1};
	}
	
	//creates basic representation of this with empty parts
	this.toFlatJson = function() {
		var jsonDymo = {
			"@id": uri,
			"@type": DYMO
		}
		if (type) {
			jsonDymo["ct"] = type;
		}
		if (sourcePath) {
			jsonDymo["source"] = sourcePath;
		}
		if (navigator instanceof SimilarityNavigator) {
			jsonDymo["navigator"] = SIMILARITY_NAVIGATOR;
		}
		for (var featureName in features) {
			jsonDymo[featureName] = this.getFeatureJson(featureName);
		}
		if (mappings.length > 0) {
			jsonDymo["mappings"] = [];
			for (var i = 0; i < mappings.length; i++) {
				jsonDymo["mappings"].push(mappings[i].toJson());
			}
		}
		if (parts.length > 0) {
			jsonDymo["parts"] = [];
		}
		if (similars.length > 0) {
			jsonDymo["similars"] = [];
			for (var i = 0; i < similars.length; i++) {
				jsonDymo["similars"].push(similars[i].getUri());
			}
		}
		return jsonDymo;
	}
	
	this.getFeatureJson = function(featureName) {
		return {
			"value" : features[featureName],
			"type" : FEATURE,
			"adt" : featureName.charAt(0).toUpperCase() + featureName.slice(1)
		};
	}
	
}