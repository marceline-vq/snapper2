var app = angular.module("snap", []);

// main top level controller for the app
app.controller("mainController", [
	// the passed arguments you're using in this controler
	// $scope used to pass things between the controller and the html page
	"$scope", "$http", 
	function($scope, $http){
			// Grab elements, create settings, etc.
			var canvas = document.getElementById("canvas"),
				context = canvas.getContext("2d"),
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
				var test = canvas.toDataURL('image/png');
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
			console.log("payload constructing, sending now...");

			// http post to save the image file, on success retrieve highest emotion and its value as computed by the node server
			$http.post("/savefile", imgPayload).success(function(response){
				var highestEmo = response.emotion;
				var highestVal = response.value;
				var stamp = document.getElementById('rubber_stamp');
				stamp.style.display = "block";
				stamp.innerHTML = highestEmo;
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