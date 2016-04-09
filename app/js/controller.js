var app = angular.module("snap", []);

//sets up what pages to serve when you go to a url

//main top level controller for the app
app.controller("mainController", [

	//the passed arguments you're using in this controler
	// $scope is used to pass things between the controller and the html page
	"$scope", "$http", 
	function($scope, $http){

		/*$http.get("/savefile").success(function(response){
			console.log(response);
		});*/

		window.imageProcessed = function(base64img){

			
			var base64data = base64img.replace(/^data:image\/png;base64,/, "");
			var imgPayload = {
				data : base64data
			}
			var highestEmo;
			var highest = {
				emo : highestEmo
			}



			console.log("payload constructing, sending now...");

			$http.post("/savefile", imgPayload).success(function(response){
				var highestEmo = response.emotion;
				var highestVal = response.value;
				var stamp = document.getElementById('rubber_stamp');
				stamp.style.display = "block";
				stamp.innerHTML = highestEmo;
			});	
		}	

		function callAPI(filePath){
			// api key i'm using
			var apiKey = "fca2ec21f98743a69255528052fc2aea";
			 
			// api url for making calls to it and receiving responses 
			var apiUrl = "https://api.projectoxford.ai/emotion/v1.0/recognize";

			$.ajax({
				url: apiUrl,
				beforeSend: function (xhrObj) {
					xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
					xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", apiKey);
				},
				type: "POST",
				data: filePath,
				//dataType: "json",
				processData: false
			})
			.done(function (response) {
				ProcessResult(response);
			})
			.fail(function (error) {
				$("#response").text(error.getAllResponseHeaders());
			});
		}



		$scope.processImage = function(){
			var camImg = $scope.image;
			console.log(camImg);
			var base64Data = camImg.replace(/^data:image\/png;base64,/, "");
			var imageData = {
				data : base64Data
			};




			//console.log(base64image);
			/*$http.post("/savefile", test).success(function(response){
				console.log(response);
			});*/

			$http.post("/savefile", imageData).success(function(response){
				console.log("from test server : " + response);
			});



		} //clickButtonToSendThingToTheServer

	}//mainController function

]);