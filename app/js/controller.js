//dymo stuff
//var isPlaying = true;
//var limits;

var app 			= angular.module("snap", []);
var MOOD_URI 		= "http://127.0.0.1:8070";
var COORD_QUERY 	= "findNearestTrack";
var METADATA_QUERY 	= "getLocalMetadata";
var DYMO_URI 		= "http://localhost:8090/";
var MB_QUERY 		= "getMusicbrainzMetadata";
var AUDIO_SERVICE 	= "loadAudioFile";
var AUDIO_BASE_URI 	= "http://localhost:8050/ilmaudio/mp3/";
var LIMITS_QUERY 	= "coordinateLimits";
var uri 			= MOOD_URI + "/" + LIMITS_QUERY + "?configNumber=" + configNumber; //POTENTIAL BUG : configNumber has not been defined

myMoodplay.init();
AudioPlayer.init();
myMoodplay.playlist = [];
myMoodplay.sendRequest(uri, myMoodplay.processLimitsResponse);

try {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext();
} catch(e) {
    throw new Error('Web Audio API not supported.');
}			  
	
// main top level controller for the app
app.controller("mainController", [

	"$scope", "$http", 
	function($scope, $http){
	
		// Grab elements, create settings, etc.
		var moodInput 		= document.getElementById('mood_tag');
		var cameraCanvas 	= document.getElementById("camera_canvas");
		var context 		= cameraCanvas.getContext("2d");
		var video 			= document.getElementById("video");
		var videoObj 		= { "video" : true };

		var errBack 		= function(error) {
			console.log("Video capture error: ", error.code); 
		};

		var moodOriginal;
		var moodInverted;
		var moodSelected;

		// Put video listeners into place
		if(navigator.getUserMedia) { // Standard
			navigator.getUserMedia(videoObj, function(stream) {
				video.src = stream;
				video.play();
			}, errBack);
		} else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
			navigator.webkitGetUserMedia(videoObj, function(stream){
				video.src = window.URL.createObjectURL(stream);
				video.play();
			}, errBack);
		} else if(navigator.mozGetUserMedia) { // WebKit-prefixed
			navigator.mozGetUserMedia(videoObj, function(stream){
				video.src = window.URL.createObjectURL(stream);
				video.play();
			}, errBack);
		}

		//plays song based on mood
		document.getElementById("play_btn1").addEventListener("click", function(){		

			var x 				= 0.1;
			var y 				= 0.2;
			moodInput.display 	= "block";
			moodInput.innerHTML = moodOriginal;

			console.log(moodOriginal);
			
			for(var i=0; i<myMoodplay.moods.length; i++){
				if(myMoodplay.moods[i][0] == moodOriginal){
					//console.log("NOW LOOPING : mood " + myMoodplay.moods[i][0]);
					x = myMoodplay.moods[i][1];
					//console.log("NOW LOOPING : x " + x);
					y = myMoodplay.moods[i][2];
					//console.log("NOW LOOPING : y " + y);
				}
			}
			//console.log("SENDING THE SPARQLQUERY FROM MATCHEDMOOD");
			console.log(x, y);
			myMoodplay.sendSPARQLQuery(x,y);
			//console.log("mood original : " + moodSelected);
			//console.log("x value: " + x);
			//console.log("y value: " + y);
		});

		//plays song base don the opposite of the mood
		document.getElementById("play_btn2").addEventListener("click", function(){
				
			var x 				= 0.1;
			var y 				= 0.2;
			moodInput.display 	= "block";
			moodInput.innerHTML = moodInverted;

			for(var i=0; i<myMoodplay.moods.length; i++){
				if(myMoodplay.moods[i][0] == moodInverted){
					//console.log("NOW LOOPING : mood " + myMoodplay.moods[i][0]);
					x = myMoodplay.moods[i][1];
					//console.log("NOW LOOPING : x " + x);
					y = myMoodplay.moods[i][2];
					//console.log("NOW LOOPING : y " + y);
				}
			}

			//console.log("SENDING THE SPARQLQUERY FROM FLIPPEDMOOD");
			myMoodplay.sendSPARQLQuery(x,y);

			//flipMoodRadio.checked = false;
			//console.log("mood original : " + moodSelected);
			//console.log("x value: " + x);
			//console.log("y value: " + y);
		});	
			
		// Trigger photo take
		document.getElementById("snap").addEventListener("click", function() {
			context.drawImage(video, 0, 0, 640, 480);

			// get base64 sent to the function converting it to an image file
			var test = cameraCanvas.toDataURL('image/png');
			window.imageProcessed(test);
		});	

		
		window.imageProcessed = function(base64img){

			// sending the payload from base64 to the server
			var highestEmo;

			//creates base64 image to send to server for saving
			var base64data = base64img.replace(/^data:image\/png;base64,/, "");
			var imgPayload = { data : base64data };

			// highest emotion as calculated and received from the server
			var highest 		= { emo : highestEmo };
			var moodForMusic 	= { moodTag : moodOriginal };
			var moodForMusicInv = { moodTag : moodInverted };

			//console.log("payload constructing, sending now...");

			// http post to save the image file, on success retrieve highest emotion and its value as computed by the node server
			$http.post("/savefile", imgPayload).success(function(response){
				var highestEmo 	= response.emotion;
				//console.log("highest emo : " + highestEmo);
				var highestVal 	= response.value;
				//console.log("highest value : " + highestVal);
				var stamp 		= document.getElementById('rubber_stamp');
				stamp.style.display = "block";
				stamp.innerHTML = highestEmo;
				//console.log("play music !");
				moodOriginal 	= response.mood;
				//console.log("normal mood " + moodOriginal);
				moodInverted 	= response.invertedMood;
				//console.log("flipped mood " + moodInverted);
				//moodInput = document.getElementById('mood_tag');			
			});//END /savefile async call

			

			myMoodplay.playlist = [];	
		};

		// the image saving function
		$scope.processImage = function(){
			var camImg 		= $scope.image;
			var base64Data 	= camImg.replace(/^data:image\/png;base64,/, "");
			var imageData 	= { data : base64Data };

			$http.post("/savefile", imageData).success(function(response){
				console.log("from test server : " + response);
			});//END savefile async call
		}; //END process image
		
	} // mainController functions

]); //mainController