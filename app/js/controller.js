// VARIABLES FOR LAUNCHING MOODPLAY
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

// Initialise the audioplayer  
myMoodplay.init();
AudioPlayer.init();
myMoodplay.playlist = [];

// send the request for coordinates to find nearest neighbour
myMoodplay.sendRequest(uri, myMoodplay.processLimitsResponse);

// activate the audio player on the window
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
	
		// grab video, canvas and mood elements
		var moodInput 		= document.getElementById('mood_tag');
		var cameraCanvas 	= document.getElementById("camera_canvas");
		var context 		= cameraCanvas.getContext("2d");
		var video 			= document.getElementById("video");
		var videoObj 		= { "video" : true };

		var errBack 		= function(error) {
			console.log("Video capture error: ", error.code); 
		};

		// variables for mood-tag results
		var moodOriginal;
		var moodInverted;
		var moodSelected;

		// Put video listeners into place to stream live video on the screen
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

		// button listener to play song based on the normal mood-tag; so angry = angry
		document.getElementById("play_btn1").addEventListener("click", function(){		
			// moodplay coordinates
			var x 				= 0.1;
			var y 				= 0.2;

			// set up mood-tag display in the html
			moodInput.display 	= "block";
			moodInput.innerHTML = moodOriginal;
			
			// call the function to colour-code moods
			colourMoods(moodInput);
			
			// find the corresponding mood-tag in the moodplay and assign coordinates for the particular one
			for(var i=0; i<myMoodplay.moods.length; i++){
				if(myMoodplay.moods[i][0] == moodOriginal){
					x = myMoodplay.moods[i][1];
					y = myMoodplay.moods[i][2];
				}
			}
			// send the SPARQL Query to play music, based on the results 
			myMoodplay.sendSPARQLQuery(x,y);
		});

		// button listener to play song based on the inverted mood-tag; so angry = chill
		document.getElementById("play_btn2").addEventListener("click", function(){
			// moodplay coordinates	
			var x 				= 0.1;
			var y 				= 0.2;

			// set up mood-tag display in the html
			moodInput.display 	= "block";
			moodInput.innerHTML = moodInverted;

			// call the function to colour-code moods
			colourMoods(moodInput);

			// find the corresponding inverted mood-tag in the moodplay and assign coordinates for the particular one
			for(var i=0; i<myMoodplay.moods.length; i++){
				if(myMoodplay.moods[i][0] == moodInverted){
					x = myMoodplay.moods[i][1];
					y = myMoodplay.moods[i][2];

					// change the song but keep it the same style
					if(moodInverted == "pleasure"){
						x=x+0.02;
						y=y+0.02;	
					}
				}
			}
			// send the SPARQL Query to play music, based on the results 
			myMoodplay.sendSPARQLQuery(x,y);
		});	
			
		// trigger photo take
		document.getElementById("snap").addEventListener("click", function() {
			// draw the image from the video feed on the canvas
			context.drawImage(video, 0, 0, 640, 480);

			// get base64 sent to the function converting it to an image file
			var test = cameraCanvas.toDataURL('image/png');
			window.imageProcessed(test);
		});	

		
		// function to process the functions to / from server
		window.imageProcessed = function(base64img){
			// sending the payload from base64 to the server
			var highestEmo;

			// create base64 image to send to server for saving
			var base64data = base64img.replace(/^data:image\/png;base64,/, "");
			var imgPayload = { data : base64data };

			// highest emotion as calculated and received from the server
			var highest 		= { emo : highestEmo };
			var moodForMusic 	= { moodTag : moodOriginal };
			var moodForMusicInv = { moodTag : moodInverted };

			// http post to save the image file, on success retrieve highest emotion and its value as computed by the node server
			$http.post("/savefile", imgPayload).success(function(response){
				var highestEmo 	= response.emotion;
				var highestVal 	= response.value;
				var stamp 		= document.getElementById('rubber_stamp');
				// display the highest emotion on the snap
				stamp.style.display = "block";
				stamp.innerHTML = highestEmo;
				moodOriginal 	= response.mood;
				moodInverted 	= response.invertedMood;			
			});//END /savefile async call
			//myMoodplay.playlist = [];	
		};

		// the image saving function
		$scope.processImage = function(){
			var camImg 		= $scope.image;
			var base64Data 	= camImg.replace(/^data:image\/png;base64,/, "");
			var imageData 	= { data : base64Data };

			$http.post("/savefile", imageData).success(function(response){
				console.log("from test server : " + response);
			}); 
		}; //END processImage
		
		// function to colour-code the moods
		function colourMoods(moodInput){
			// getting the mood value to display it
			var moodVal = moodInput.innerHTML;
			console.log(moodVal);
			// getting the container for moods 
			var moodBg = document.getElementById('wrapper_for_mood');

			// switching the background colour / border based on the current mood-tag
			switch(moodVal){
				case "angry": 
					moodBg.style.backgroundColor = "#ff2500"; // BRIGHT RED
					moodBg.style.border = "2px solid #000";
					break;
				case "dark":
					moodBg.style.backgroundColor = "#2c0059"; // PURPLISH BLUE
					moodBg.style.border = "2px solid #000";
					break;
				case "cold":
					moodBg.style.backgroundColor = "#4c8eff"; // LIGHT BLUE
					moodBg.style.border = "2px solid #000";
					break;
				case "terror":
					moodBg.style.backgroundColor = "#600003"; // DARK RED
					moodBg.style.border = "2px solid #000";
					break;
				case "happy":
					moodBg.style.backgroundColor = "#00cd00"; // BRIGHT GREEN
					moodBg.style.border = "2px solid #000";
					break;
				case "neutral":
					moodBg.style.backgroundColor = "#ccc"; // GREY
					moodBg.style.border = "2px solid #000";
					break;
				case "depressive":
					moodBg.style.backgroundColor = "#a5c6ff"; // BRIGHT BLUE
					moodBg.style.border = "2px solid #000";
					break;
				case "harsh":
					moodBg.style.backgroundColor = "#930005"; // MEDIUM RED
					moodBg.style.border = "2px solid #000";
					break;
				case "chill":
					moodBg.style.backgroundColor = "#40e0d0"; // TURQUOISE
					moodBg.style.border = "2px solid #000";
					break;
				case "laid back":
					moodBg.style.backgroundColor = "#56e48f"; // LIGHT GREEN
					moodBg.style.border = "2px solid #000";
					break;
				case "pleasure":
					moodBg.style.backgroundColor = "#a0e040"; // YELLOWISH GREEN
					moodBg.style.border = "2px solid #000";
					break;
				case "epic":
					moodBg.style.backgroundColor = "#4ca6ff"; // LIGHT BLUE
					moodBg.style.border = "2px solid #000";
					break;
				case "melancholy":
					moodBg.style.backgroundColor = "#7fbfff"; // BRIGHT BLUE
					moodBg.style.border = "2px solid #000";
					break;
				case "party":
					moodBg.style.backgroundColor = "#e69500"; // ORANGE
					moodBg.style.border = "2px solid #000";
					break;
				case "upbeat":
					moodBg.style.backgroundColor = "#e6e600"; // YELLOW
					moodBg.style.border = "2px solid #000";
					break;
				case "dreamy":
					moodBg.style.backgroundColor = "#94b2e5"; // BRIGHT BLUE 
					moodBg.style.border = "2px solid #000";
					break;
				default: moodBg.style.backgroundColor = "#fff"; 
			}
		}; // END colourMoods
	} // mainController functions

]); //mainController