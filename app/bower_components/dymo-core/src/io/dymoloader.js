/**
 * A DymoLoader loads dymos from rdf, jams, or json-ld.
 * @constructor
 */
function DymoLoader(scheduler, $scope, $http) {
	
	var mobileRdfUri = "rdf/mobile.n3";
	var multitrackRdfUri = "http://purl.org/ontology/studio/multitrack";
	var rdfsUri = "http://www.w3.org/2000/01/rdf-schema";
	
	var dmos = {}; //dmos at all hierarchy levels for quick access during mapping assignment
	var features = {};
	
	//TODO PUT IN CENTRAL PLACE!!
	var jsonKeys = ["@id", "@type", "ct", "source", "navigator", "similars", "mappings", "parts"];
	
	this.loadDymoFromJson = function(basePath, jsonUri, callback) {
		scheduler.setDymoBasePath(basePath);
		loadJson(jsonUri, {}, callback, createDymoFromJson);
	}
	
	this.parseDymoFromJson = function(json, callback) {
		callback(createDymoFromJson(json, {}));
	}
	
	this.loadRenderingFromJson = function(jsonUri, dymoMap, callback) {
		loadJson(jsonUri, dymoMap, callback, createRenderingFromJson);
	}
	
	this.loadGraphFromJson = function(jsonUri, dymoMap, callback) {
		loadJson(jsonUri, dymoMap, callback, createGraphFromJson);
	}
	
	//only calls callback once all file references within the json are loaded
	function loadJson(jsonUri, dymoMap, callback, creatingFunction) {
		recursiveLoadJson(jsonUri, "", dymoMap, callback, creatingFunction);
	}
	
	function recursiveLoadJson(jsonUri, jsonString, dymoMap, callback, creatingFunction) {
		var oReq = new XMLHttpRequest();
		oReq.addEventListener("load", function() {
			if (jsonString) {
				jsonString = jsonString.replace('"'+jsonUri+'"', this.responseText);
				//console.log(jsonString)
			} else {
				jsonString = this.responseText;
			}
			var nextUri = findNextJsonUri(jsonString);
			if (nextUri) {
				recursiveLoadJson(nextUri, jsonString, dymoMap, callback, creatingFunction);
			} else {
				callback(creatingFunction(JSON.parse(jsonString), dymoMap));
			}
		});
		oReq.open("GET", scheduler.getDymoBasePath()+jsonUri);
		oReq.send();
		//}
	}
	
	function findNextJsonUri(jsonString) {
		var index = jsonString.indexOf(".json");
		if (index >= 0) {
			if (index != jsonString.indexOf("context.json")+7) {
				var before = jsonString.substring(0, index);
				var beginning = before.lastIndexOf('"');
				return jsonString.substring(beginning+1, index+5);
			} else {
				return findNextJsonUri(jsonString.substring(index+1));
			}
		}
	}
	
	function createDymoFromJson(json, dymoMap) {
		//first create all dymos and save references in map
		var dymo = recursiveCreateDymoAndParts(json, dymoMap);
		//then add similarity relations
		recursiveAddMappingsAndSimilars(json, dymoMap);
		return [dymo, dymoMap];
	}
	
	function recursiveCreateDymoAndParts(json, dymoMap) {
		var dymo = new DynamicMusicObject(json["@id"], scheduler, json["ct"]);
		dymoMap[json["@id"]] = dymo;
		dymo.setSourcePath(json["source"]);
		if (json["navigator"]) {
			dymo.setNavigator(getNavigator(json["navigator"], dymo));
		}
		for (var attribute in json) {
			if (jsonKeys.indexOf(attribute) < 0) {
				if (json[attribute]["type"] == FEATURE) {
					dymo.setFeature(attribute, json[attribute].value);
				}
				else if (json[attribute]["type"] == PARAMETER) {
					addOrUpdateDymoParameter(dymo, attribute, json[attribute].value);
				}
			}
		}
		if (json["parts"]) {
			for (var i = 0; i < json["parts"].length; i++) {
				dymo.addPart(recursiveCreateDymoAndParts(json["parts"][i], dymoMap));
			}
		}
		return dymo;
	}
	
	function recursiveAddMappingsAndSimilars(json, dymoMap) {
		var dymo = dymoMap[json["@id"]];
		//first add similars
		if (json["similars"]) {
			for (var i = 0; i < json["similars"].length; i++) {
				dymo.addSimilar(dymoMap[json["similars"][i]]);
			}
		}
		//then add mappings
		if (json["mappings"]) {
			for (var i = 0; i < json["mappings"].length; i++) {
				dymo.addMapping(createMappingFromJson(json["mappings"][i], dymoMap, dymo));
			}
		}
		//iterate through parts
		if (json["parts"]) {
			for (var i = 0; i < json["parts"].length; i++) {
				recursiveAddMappingsAndSimilars(json["parts"][i], dymoMap);
			}
		}
	}
	
	function createRenderingFromJson(json, dymoMap) {
		var rendering = new Rendering(dymoMap[json["topDymo"]]);
		var controls = {};
		for (var i = 0; i < json["mappings"].length; i++) {
			var currentMapping = json["mappings"][i];
			rendering.addMapping(createMappingFromJson(currentMapping, dymoMap, undefined, controls));
		}
		return [rendering, controls];
	}
	
	/** @param {Object=} controls (optional) */
	function createMappingFromJson(json, dymoMap, dymo, controls) {
		if (json["controls"]) {
			var targetControls = [];
			for (var j = 0; j < json["controls"].length; j++) {
				targetControls.push(controls[json["controls"][j]]);
			}
			return createMappingToObjectsFromJson(json, dymoMap, dymo, targetControls, controls);
		} else if (json["dymos"]) {
			var dymos = [];
			var constraintFunction;
			if (json["dymos"] instanceof Array) {
				for (var j = 0; j < json["dymos"].length; j++) {
					dymos.push(dymoMap[json["dymos"][j]]);
				}
			} else {
				constraintFunction = Function.apply(null, json["dymos"]["args"].concat(json["dymos"]["body"]));
				var allDymos = Object.keys(dymoMap).map(function(key) { return dymoMap[key]; });
				Array.prototype.push.apply(dymos, allDymos.filter(constraintFunction));
			}
			return createMappingToObjectsFromJson(json, dymoMap, dymo, dymos, controls, constraintFunction);
		}
	}
	
	/** @param {Function=} dymoConstraint (optional) */
	function createMappingToObjectsFromJson(json, dymoMap, dymo, targets, controls, dymoConstraint) {
		var isRelative = json["relative"];
		var domainDims = [];
		for (var j = 0; j < json["domainDims"].length; j++) {
			var currentName = json["domainDims"][j]["name"];
			var currentType = json["domainDims"][j]["type"];
			if (currentType == FEATURE) {
				domainDims.push(currentName);
			} else if (currentType == PARAMETER) {
				var currentParameter;
				if (dymo) {
					currentParameter = addOrUpdateDymoParameter(dymo, currentName, 0);
				} else {
					currentParameter = new Parameter(currentName, 0);
				}
				domainDims.push(currentParameter);
			} else {
				var control;
				if (controls) {
					if (!controls[currentName]) {
						controls[currentName] = getControl(currentType, currentName);
					}
					control = controls[currentName];
				} else {
					control = getControl(currentType, currentName);
				}
				domainDims.push(control);
			}
		}
		return new Mapping(domainDims, isRelative, json["function"], targets, json["parameter"], dymoConstraint);
	}
	
	function addOrUpdateDymoParameter(dymo, name, value) {
		var currentParameter = dymo.getParameter(name);
		if (!currentParameter) {
			currentParameter = new Parameter(name, value);
			dymo.addParameter(currentParameter);
		} else {
			currentParameter.update(value);
		}
		return currentParameter;
	}
	
	//currently only works for generically named dymos
	function createGraphFromJson(json, dymoMap) {
		for (var i = 0; i < json.length; i++) {
			if (json[i]) {
				for (var j = 0; j < json[i].length; j++) {
					var dymo = dymoMap["dymo"+i];
					var similarDymo = dymoMap["dymo"+json[i][j]];
					if (dymo && similarDymo) {
						dymo.addSimilar(similarDymo);
					}
				}
			}
		}
	}
	
	function getNavigator(type, dymo) {
		if (type == SIMILARITY_NAVIGATOR) {
			return new SimilarityNavigator(dymo);
		}
		return new SequentialNavigator(dymo);
	}
	
	function getControl(type, label) {
		if (type == ACCELEROMETER_X) {
			return getAccelerometerControl(0);
		} else if (type == ACCELEROMETER_Y) {
			return getAccelerometerControl(1);
		}	else if (type == ACCELEROMETER_Z) {
			return getAccelerometerControl(2);
		} else if (type == TILT_X) {
			return getAccelerometerControl(3);
		} else if (type == TILT_Y) {
			return getAccelerometerControl(4);
		} else if (type == GEOLOCATION_LATITUDE) {
			return getGeolocationControl(0);
		}	else if (type == GEOLOCATION_LONGITUDE) {
			return getGeolocationControl(1);
		}	else if (type == GEOLOCATION_DISTANCE) {
			return getGeolocationControl(2);
		}	else if (type == COMPASS_HEADING) {
			return getCompassControl(0);
		}	else if (type == SLIDER) {
			return new Control(label, type);
		} else if (type == TOGGLE) {
			return new Control(label, type);
		} else if (type == BUTTON) {
			return new Control(label, type);
		} else if (type == RANDOM) {
			return getStatsControl(0, label);
		} else if (type == BROWNIAN) {
			return getBrownianControl(0, label);
		} else if (type == RAMP) {
			return getRampControl(0, label);
		}
	}
	
	function getStatsControl(index, uri) {
		if (index == 0) {
			return new StatsControls().randomControl;
		} else {
			return new StatsControls();
		}
	}
	
	function getBrownianControl(index, uri) {
		if (index == 0) {
			return new BrownianControls().brownianControl;
		} else {
			return new BrownianControls();
		}
	}
	
	function getRampControl(index, uri) {
		if (index == 0) {
			return new RampControls().linearRampControl;
		} else {
			return new RampControls();
		}
	}
	
	function getAccelerometerControl(index) {
		if (!$scope.accelerometerWatcher) {
			$scope.accelerometerWatcher = new AccelerometerWatcher();
		}
		if (index == 0) {
			return $scope.accelerometerWatcher.xControl;
		} else if (index == 1) {
			return $scope.accelerometerWatcher.yControl;
		} else if (index == 2){
			return $scope.accelerometerWatcher.zControl;
		} else if (index == 3){
			return $scope.accelerometerWatcher.tiltXControl;
		} else if (index == 4){
			return $scope.accelerometerWatcher.tiltYControl;
		}
	}
	
	function getGeolocationControl(index) {
		if (!$scope.geolocationWatcher) {
			$scope.geolocationWatcher = new GeolocationWatcher();
		}
		if (index == 0) {
			return $scope.geolocationWatcher.latitudeControl;
		} else if (index == 1) {
			return $scope.geolocationWatcher.longitudeControl;
		} else {
			return $scope.geolocationWatcher.distanceControl;
		}
	}
	
	function getCompassControl(index) {
		if (!$scope.compassWatcher) {
			$scope.compassWatcher = new CompassWatcher();
		}
		if (index == 0) {
			return $scope.compassWatcher.headingControl;
		} else {
			return $scope.compassWatcher.accuracyControl;
		}
	}
	
	
	/*this.loadDmo = function(rdfUri) {
		$http.get(dmoPath+rdfUri).success(function(data) {
			rdfstore.create(function(err, store) {
				store.load('text/turtle', data, function(err, results) {
					if (err) {
						console.log(err);
					}
					store.execute("SELECT ?rendering ?label \
					WHERE { ?rendering a <"+mobileRdfUri+"#Rendering> . \
					?rendering <"+rdfsUri+"#label> ?label }", function(err, results) {
						for (var i = 0; i < results.length; i++) {
							//TODO MAKE LIST WITH SEVERAL SELECTABLE RENDERINGS!!
							loadRendering(store, results[i].rendering.value, results[i].label.value);
						}
					});
				});
			});
		});
	}
	
	function loadRendering(store, renderingUri, label) {
		store.execute("SELECT ?dmo \
		WHERE { <"+renderingUri+"> <"+mobileRdfUri+"#hasDMO> ?dmo }", function(err, results) {
			$scope.rendering = new Rendering(label, $scope);
			$scope.scheduler = new Scheduler($scope.audioContext, function() {
				$scope.sourcesReady = true;
			});
			for (var i = 0; i < results.length; i++) {
				loadDMO(store, results[i].dmo.value);
			}
			loadMappings(store, renderingUri);
		});
	}
	
	function loadDMO(store, dmoUri, parentDMO) {
		var dmo = new DynamicMusicObject(dmoUri, $scope.scheduler);
		dmos[dmoUri] = dmo;
		if (parentDMO) {
			parentDMO.addPart(dmo);
		} else {
			$scope.rendering.dmo = dmo; //pass top-level dmo to rendering
		}
		loadAudioPath(store, dmoUri, dmo);
		loadParameters(store, dmoUri, dmo);
		loadChildren(store, dmoUri, dmo);
	}
	
	function loadAudioPath(store, dmoUri, dmo) {
		store.execute("SELECT ?audioPath \
		WHERE { <"+dmoUri+"> <"+mobileRdfUri+"#hasAudioPath> ?audioPath }", function(err, results) {
			for (var i = 0; i < results.length; i++) {
				var audioPath = dmoPath+"/"+results[i].audioPath.value;
				dmo.setSourcePath(audioPath);
				$scope.scheduler.addSourceFile(audioPath);
			}
		});
	}
	
	function loadParameters(store, dmoUri, dmo) {
		store.execute("SELECT ?parameter ?parameterType ?value ?featuresPath ?subsetCondition ?graphPath ?label \
		WHERE { <"+dmoUri+"> <"+mobileRdfUri+"#hasParameter> ?parameter . \
		OPTIONAL { ?parameter a ?parameterType . \
			?parameter <"+mobileRdfUri+"#hasValue> ?value . } \
		OPTIONAL { ?parameter <"+mobileRdfUri+"#hasFeaturesPath> ?featuresPath . } \
		OPTIONAL { ?parameter <"+mobileRdfUri+"#isSubset> ?subsetCondition . } \
		OPTIONAL { ?parameter <"+mobileRdfUri+"#hasGraphPath> ?graphPath . } \
		OPTIONAL { ?parameter <"+rdfsUri+"#label> ?label . } }", function(err, results) {
			for (var i = 0; i < results.length; i++) {
				var label = getValue(results[i].label);
				var value = getNumberValue(results[i].value);
				if (value) {
					var parameter = getParameter(dmo, results[i].parameter.value, results[i].parameterType.value);
					parameter.update(value);
				}
				if (results[i].featuresPath) {
					var featuresPath = dmoPath+"/"+results[i].featuresPath.value;
					var subsetCondition = getValue(results[i].subsetCondition);
					loadFeatures(dmo, results[i].parameter.value, featuresPath, subsetCondition, label);
				}
				if (results[i].graphPath) {
					var graphPath = dmoPath+"/"+results[i].graphPath.value;
					loadGraph(dmo, results[i].parameter.value, graphPath, label);
				}
			}
			if (results.length <= 0) {
				$scope.ontologiesLoaded = true;
			}
		});
	}
	
	function loadChildren(store, dmoUri, dmo) {
		store.execute("SELECT ?child \
		WHERE { <"+dmoUri+"> <"+mobileRdfUri+"#hasChild> ?child }", function(err, results) {
			for (var i = 0; i < results.length; i++) {
				loadDMO(store, results[i].child.value, dmo);
			}
		});
	}
	
	function loadMappings(store, renderingUri) {
		store.execute("SELECT ?mapping WHERE { <"+renderingUri+"> <"+mobileRdfUri+"#hasMapping> ?mapping }", function(err, results) {
			for (var i = 0; i < results.length; i++) {
				loadMapping(store, results[i].mapping.value);
			}
		});
	}
	
	function loadMapping(store, mappingUri) {
		$scope.mappingLoadingThreads++;
		store.execute("SELECT ?mappingType ?object ?parameter ?parameterType \
		WHERE { <"+mappingUri+"> a ?mappingType . \
			<"+mappingUri+"> <"+mobileRdfUri+"#toParameter> ?parameter . \
		OPTIONAL { <"+mappingUri+"> <"+mobileRdfUri+"#toObject> ?object . } \
		OPTIONAL { ?parameter a ?parameterType . } }", function(err, results) {
			for (var i = 0; i < results.length; i++) {
				if (results[i].object) {
					var object = dmos[results[i].object.value];
					if (!object) {
						object = getGraphControl(undefined, results[i].object.value);
						if (!object) {
							object = getStatsControl(undefined, results[i].object.value);
						}
					}
				}
				if (results[i].parameterType) {
					var parameterType = results[i].parameterType.value;
				}
				var mappingType = MappingTypes.PRODUCT_MAPPING;
				if (results[i].mappingType.value == mobileRdfUri+"#SumMapping") {
					mappingType = MappingTypes.SUM_MAPPING;
				}
				var parameter = getParameter(object, results[i].parameter.value, parameterType);
				loadMappingDimensions(store, mappingUri, mappingType, parameter);
			}
		});
	}
	
	function loadMappingDimensions(store, mappingUri, mappingType, parameter) {
		store.execute("SELECT ?control ?controlType ?label ?controlDMO ?function ?functionType ?position ?range ?multiplier ?addend ?modulus \
		WHERE { <"+mappingUri+"> <"+mobileRdfUri+"#hasDimension> ?dimension . \
			?dimension <"+mobileRdfUri+"#fromControl> ?control . \
		OPTIONAL { ?dimension <"+mobileRdfUri+"#withFunction> ?function . \
			?function a ?functionType . } \
		OPTIONAL { ?control a ?controlType . } \
		OPTIONAL { ?control <"+rdfsUri+"#label> ?label . } \
		OPTIONAL { ?control <"+mobileRdfUri+"#fromDMO> ?controlDMO . } \
		OPTIONAL { ?dimension <"+mobileRdfUri+"#hasMultiplier> ?multiplier . } \
		OPTIONAL { ?dimension <"+mobileRdfUri+"#hasAddend> ?addend . } \
		OPTIONAL { ?dimension <"+mobileRdfUri+"#hasModulus> ?modulus . } \
		OPTIONAL { ?function <"+mobileRdfUri+"#hasPosition> ?position . } \
		OPTIONAL { ?function <"+mobileRdfUri+"#hasRange> ?range . } }", function(err, results) {
			var controls = [];
			var functions = [];
			var multipliers = [];
			var addends = [];
			var moduli = [];
			for (var i = 0; i < results.length; i++) {
				controls[i] = getControlFromResults(results[i].control, results[i].controlType, results[i].label, results[i].controlDMO);
				var position = getNumberValue(results[i].position);
				var range = getNumberValue(results[i].range);
				functions[i] = getFunction(results[i].functionType, position, range);
				multipliers[i] = getNumberValue(results[i].multiplier, 1);
				addends[i] = getNumberValue(results[i].addend, 0);
				moduli[i] = getNumberValue(results[i].modulus);
			}
			$scope.mappings[mappingUri] = new Mapping(mappingType, controls, functions, multipliers, addends, moduli, parameter);
			$scope.mappingLoadingThreads--;
			$scope.$apply();
		});
	}
	
	function getFunction(functionTypeResult, position, range) {
		if (functionTypeResult) {
			functionType = functionTypeResult.value;
			if (functionType == mobileRdfUri+"#TriangleFunction") {
				return new TriangleFunction(position, range);
			} else if (functionType == mobileRdfUri+"#RectangleFunction") {
				return new RectangleFunction(position, range);
			}
		}
		return new LinearFunction();
	}
	
	function getControlFromResults(controlResult, controlTypeResult, labelResult, dmoResult) {
		if (labelResult) {
			var label = labelResult.value;
		}
		if (controlResult) {
			var control = controlResult.value;
		}
		if (controlTypeResult) {
			var controlType = controlTypeResult.value;
		}
		if (dmoResult) {
			var dmo = dmos[dmoResult.value];
		}
		return getControl(control, controlType, label, dmo);
	}
	
	function getValue(result) {
		if (result) {
			return result.value;
		}
	}
	
	function getNumberValue(result, defaultValue) {
		if (result) {
			return Number(result.value);
		}
		return defaultValue;
	}*/
	
	/*function getControl(controlUri, controlTypeUri, label, dmo) {
		if (controlUri == mobileRdfUri+"#AccelerometerX") {
			return getAccelerometerControl(0);
		} else if (controlUri == mobileRdfUri+"#AccelerometerY") {
			return getAccelerometerControl(1);
		}	else if (controlUri == mobileRdfUri+"#AccelerometerZ") {
			return getAccelerometerControl(2);
		} else if (controlUri == mobileRdfUri+"#TiltX") {
			return getAccelerometerControl(3);
		} else if (controlUri == mobileRdfUri+"#TiltY") {
			return getAccelerometerControl(4);
		} else if (controlUri == mobileRdfUri+"#GeolocationLatitude") {
			return getGeolocationControl(0);
		}	else if (controlUri == mobileRdfUri+"#GeolocationLongitude") {
			return getGeolocationControl(1);
		}	else if (controlUri == mobileRdfUri+"#GeolocationDistance") {
			return getGeolocationControl(2);
		}	else if (controlUri == mobileRdfUri+"#CompassHeading") {
			return getCompassControl(0);
		}	else if (controlTypeUri == mobileRdfUri+"#Slider") {
			return getUIControl(0, controlUri, label);
		} else if (controlTypeUri == mobileRdfUri+"#Toggle") {
			return getUIControl(1, controlUri, label);
		} else if (controlUri == mobileRdfUri+"#Random" || controlTypeUri == mobileRdfUri+"#Random") {
			return getStatsControl(0, controlUri);
		} else if (controlTypeUri == mobileRdfUri+"#GraphControl") {
			if (dmo) {
				var graph = dmo.getGraph();
			}
			return getGraphControl(0, controlUri, graph);
		}
	}
	
	function getUIControl(type, uri, label) {
		if (!$scope.uiControls[uri]) {
			$scope.uiControls[uri] = new Control(0, label, type, $scope);
			$scope.$apply();
		}
		return $scope.uiControls[uri];
	}
	
	function getParameter(owner, parameterUri, parameterTypeUri ) {
		if (parameterUri == mobileRdfUri+"#Play" || parameterTypeUri == mobileRdfUri+"#Play") {
			return owner.play;
		} if (parameterUri == mobileRdfUri+"#Amplitude" || parameterTypeUri == mobileRdfUri+"#Amplitude") {
			return owner.amplitude;
		} if (parameterUri == mobileRdfUri+"#PlaybackRate" || parameterTypeUri == mobileRdfUri+"#PlaybackRate") {
			return owner.playbackRate;
		} else if (parameterUri == mobileRdfUri+"#Pan" || parameterTypeUri == mobileRdfUri+"#Pan") {
			return owner.pan;
		}	else if (parameterUri == mobileRdfUri+"#Distance" || parameterTypeUri == mobileRdfUri+"#Distance") {
			return owner.distance;
		} else if (parameterUri == mobileRdfUri+"#Reverb" || parameterTypeUri == mobileRdfUri+"#Reverb") {
			return owner.reverb;
		} else if (parameterUri == mobileRdfUri+"#Segmentation" || parameterTypeUri == mobileRdfUri+"#Segmentation") {
			return owner.segmentIndex;
		} else if (parameterUri == mobileRdfUri+"#SegmentCount" || parameterTypeUri == mobileRdfUri+"#SegmentCount") {
			return owner.segmentCount;
		} else if (parameterUri == mobileRdfUri+"#SegmentDurationRatio" || parameterTypeUri == mobileRdfUri+"#SegmentDurationRatio") {
			return owner.segmentDurationRatio;
		} else if (parameterUri == mobileRdfUri+"#SegmentProportion" || parameterTypeUri == mobileRdfUri+"#SegmentProportion") {
			return owner.segmentProportion;
		} else if (parameterUri == mobileRdfUri+"#ListenerOrientation" || parameterTypeUri == mobileRdfUri+"#ListenerOrientation") {
			return $scope.scheduler.listenerOrientation;
		} else if (parameterUri == mobileRdfUri+"#StatsFrequency" || parameterTypeUri == mobileRdfUri+"#StatsFrequency") {
			return owner.frequency;
		} else if (parameterUri == mobileRdfUri+"#LeapingProbability" || parameterTypeUri == mobileRdfUri+"#LeapingProbability") {
			return owner.leapingProbability;
		} else if (parameterUri == mobileRdfUri+"#ContinueAfterLeaping" || parameterTypeUri == mobileRdfUri+"#ContinueAfterLeaping") {
			return owner.continueAfterLeaping;
		}
	}*/

}