var MOOD_URI = "http://127.0.0.1:8070";
var COORD_QUERY = "findNearestTrack";
var METADATA_QUERY = "getLocalMetadata";
var DYMO_URI = "http://localhost:8090/";

var MB_QUERY = "getMusicbrainzMetadata";
var AUDIO_SERVICE = "loadAudioFile";
var AUDIO_BASE_URI = "http://localhost:8050/ilmaudio/mp3/";

//dymo stuff
//var isPlaying = true;
var limits;
var LIMITS_QUERY = "coordinateLimits";



var app = angular.module("snap", []);

var uri = MOOD_URI + "/" + LIMITS_QUERY + "?configNumber=" + configNumber;

myMoodplay.sendRequest(uri, myMoodplay.processLimitsResponse);
					
try {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext();
} catch(e) {
    throw new Error('Web Audio API not supported.');
}
					
myMoodplay.init();
AudioPlayer.init();

// main top level controller for the app
app.controller("mainController", [
	// the passed arguments you're using in this controler
	// $scope used to pass things between the controller and the html page
	"$scope", "$http", 
	function($scope, $http){
			// Grab elements, create settings, etc.
			var cameraCanvas = document.getElementById("camera_canvas"),
				context = cameraCanvas.getContext("2d"),
				video = document.getElementById("video"),
				videoObj = { "video": true },
				errBack = function(error) {
					console.log("Video capture error: ", error.code); 
				};

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

			// Trigger photo take
			document.getElementById("snap").addEventListener("click", function() {
				context.drawImage(video, 0, 0, 640, 480);
				// get base64 sent to the function converting it to an image file
				var test = cameraCanvas.toDataURL('image/png');
				window.imageProcessed(test);
			});
		

		window.imageProcessed = function(base64img){
			// sending the payload from base64 to the server
			var base64data = base64img.replace(/^data:image\/png;base64,/, "");
			var imgPayload = {
				data : base64data
			}
			// highest emotion as calculated and received from the server
			var highestEmo;
			var highest = {
				emo : highestEmo
			}
			var moodOriginal;
			var moodForMusic = {
				moodTag : moodOriginal
			}
			var moodInverted;
			var moodForMusicInv = {
				moodTag : moodInverted
			}
			console.log("payload constructing, sending now...");

			// http post to save the image file, on success retrieve highest emotion and its value as computed by the node server
			$http.post("/savefile", imgPayload).success(function(response){
				var highestEmo = response.emotion;
				console.log("highest emo : " + highestEmo);
				var highestVal = response.value;
				console.log("highest value : " + highestVal);
				var stamp = document.getElementById('rubber_stamp');
				stamp.style.display = "block";
				stamp.innerHTML = highestEmo;
				//console.log("highest value : "+highestVal);
				document.getElementById("play_button").addEventListener("click", function(){
					console.log("play music !");
					var moodOriginal = response.mood;
					console.log("normal mood " + moodOriginal);
					var moodInverted = response.invertedMood;
					console.log("flipped mood " + moodInverted);
					var moodInput = document.getElementById('mood_tag');
					moodInput.display = "block";
					moodInput.innerHTML = moodOriginal;
		

					var x = 0.32;
					var y = 0.40;


					for(var i=0; i<myMoodplay.moods.length; i++){
						if(myMoodplay.moods[i][0] == moodOriginal){
							x = myMoodplay.moods[i][1];
							y = myMoodplay.moods[i][2];
						}
					}
					console.log("mood original : " + moodOriginal);
					console.log("x value: " + x);
					console.log("y value: " + y);
					myMoodplay.sendSPARQLQuery(x,y);


//						myMoodplay.sendSPARQLQuery(0,1.0);

							//dotsHtml += "<div id='%1' class='dot'>%1</div>".replace("%1", myMoodplay.moods[m][0].replace(" ", "")).replace("%1", currentMood);	
				
	

					/*emotionPlayer.init();
					AudioPlayer.init();
					var uri = MOOD_URI + "/" + LIMITS_QUERY + "?configNumber=" + configNumber;
        			emotionPlayer.processAudioResponse(uri);*/
					//emotionPlayer.sendRequest(uri, emotionPlayer.processMoodResponse);
					
					/*try {
					  window.AudioContext = window.AudioContext || window.webkitAudioContext;
					  context = new AudioContext();
					} catch(e) {
					    throw new Error('Web Audio API not supported.');
					}*/
					



					/*app.playlist = Array();

    				try {
      					window.AudioContext = window.AudioContext || window.webkitAudioContext;
      					context = new AudioContext();
    				} catch(e) {
       				 throw new Error('Web Audio API not supported.');
   					}*/

   					//dymoManager = new DymoManager(context, 2);
    				//dymoManager.loadDymoAndRendering('data/mixdymo.json', 'data/rendering.json');
    				 //var uri = AUDIO_BASE_URI + path.replace(".wav", ".mp3");
    				// var fileURI = AUDIO_BASE_URI+"1181-01.01.mp3";
    				//AudioPlayer.loadTrack(fileURI);
				});


			});	
		}

		// the image saving function
		$scope.processImage = function(){
			var camImg = $scope.image;
			console.log(camImg);
			var base64Data = camImg.replace(/^data:image\/png;base64,/, "");
			var imageData = {
				data : base64Data
			};

			$http.post("/savefile", imageData).success(function(response){
				console.log("from test server : " + response);
			});
		} // end processImage()

		
	} // mainController functions


]);