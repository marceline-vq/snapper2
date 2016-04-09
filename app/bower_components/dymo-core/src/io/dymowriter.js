/**
 * A DymoWriter will write dymos to json or rdf.
 * @constructor
 */
function DymoWriter($http) {
	
	var RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
	var dmoRdfUri = "rdf/dmo.n3";
	var mobileRdfUri = "rdf/mobile.n3";
	var charmRdfUri = "rdf/charm.n3";
	var multitrackRdfUri = "http://purl.org/ontology/studio/multitrack";
	var rdfsUri = "http://www.w3.org/2000/01/rdf-schema";
	
	this.writeDymoToJson = function(dymo, path, name) {
		dymo["@context"] = "http://purl.org/ontology/dymo/context.json";
		if (!name) {
			name = 'dymo.json'
		}
		writeJson(dymo, path+name);
	}
	
	this.writeRenderingToJson = function(rendering, path) {
		writeJson(rendering, path+'rendering.json');
	}
	
	function writeJson(json, path) {
		httpPost(path, json);
	}
	
	this.writeDmoToRdf = function(uri) {
		var writer = N3.Writer({ prefixes: { 'ch':charmRdfUri+'#', 'dmo':dmoRdfUri+'#', 'mb':mobileRdfUri+'#' } });
		addDmo(writer);
		writer.end(function (error, result) { console.log(result); });
	}
	
	function addDmo(writer) {
		writer.addTriple('_:',
			RDF_TYPE,
			'dmo:DMO');
		writer.addTriple('_:',
			'ch:hasPart',
			'ch:test2');
	}
	
	function httpPost(uri, content) {
		var xhr = new XMLHttpRequest();
		xhr.send(content);
		xhr.addEventListener("save", function() {
			console.log("saved " + uri);
		});
		xhr.addEventListener("error", function() {
			console.log("saving " + uri + " failed");
		});
		xhr.open("POST", uri);
		xhr.send();
	}
	
}