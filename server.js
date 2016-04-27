
// Initialise all functions in an async one
(function() {
	// including all the necessary modules
	var express = require('express');
	var fs = require('fs');
	var bodyParser = require("body-parser");

	var app = express();
	// API key for OxfordProject Emotion 
	var apiKey = "fca2ec21f98743a69255528052fc2aea";
	var oxford = require('project-oxford'),
    client = new oxford.Client(apiKey);

    // assing a port number for the node server to run on
	var PORT = 8050;
	app.use(express["static"](__dirname + '/app'));
	app.use(bodyParser.json({limit: '50mb'}));
	console.log("startin the serverrrrr now");

	// processing the savefile function
	app.get("/savefile", function(request, response){
		response.send({
			message : "saving file."
		});
	});

	// saving the file on the local path on a computer
	app.post("/savefile", function(request, response){
		console.log("payload received, now about to do stuff...");
		var imageData = request.body.data;
		var imgPath = "app/snaps/photo.png";

		// variables to assign the resulting emotions to
		var highestEmotion;
		var matchedMood;
		var flippedMood;
		var error;

		// function that happens upon file save to the system
		fs.writeFile(imgPath, imageData, 'base64', function(err) {
			// if all fails
			if(err){
				console.log(err);
			} 
			else { 
				// analyse the emotion with the API call, based on the path of the saved image
  				client.emotion.analyzeEmotion({
    				path: imgPath,
				}).then(function (result) {
					// if no results are detected send back the error to the controller
    				if(result.length==0) {
    					response.send({
    						emotion : "No emotion detected", 
							value : "No value found",
							mood : "No mood found",
							invertedMood : "No flipped mood found"
    					});
    				} else {
					// retrieve emotion scores from the API
					var emotions = result[0].scores;
					
					// variables for highest value and the name of the emotion corresponding to it
					var highestValue = -1;
					var emotionName;

					// compare the emotion values to each other and save the highest one
					for(emotionName in emotions){
						emotionValue = emotions[emotionName];
						console.log(emotionName + " : " + emotionValue);
						if(emotionValue > 0 && emotionValue < 1){
							if(emotionValue > highestValue) {
								highestValue = emotionValue;
								highestEmotion = emotionName;
							}	
						}
					}
					// call the function to assign emotions to mood-tags
					matchedMood = selectMood(highestEmotion);
					flippedMood = flipMood(highestEmotion);

					// send the responses back to the controller
					response.send({
						emotion : highestEmotion, 
						value : highestValue,
						mood : matchedMood,
						invertedMood : flippedMood
				
					});
					// delete the snap from the system
					fs.unlinkSync(imgPath);
				}
				// happens if the API call is unsucessful
				},function(error){
					response.send("server.error");
				});
			}
		});
	});

// start the server
app.listen(PORT, function() {
		console.log('moodplay server started at http://localhost:' + PORT);
	});

}).call(this);

		// map the highest emotion to the mood-tags in Moodplay
		function selectMood(highestEmotion){
			var matchedMood;
			switch(highestEmotion){
				case "anger":
					matchedMood = "angry"; 
					break;
				case "contempt":
					matchedMood = "dark"; 
					break;
				case "disgust":
					matchedMood = "cold"; 
					break;
				case "fear":
					matchedMood = "terror"; 
					break;
				case "happiness":
					matchedMood = "happy"; 
					break;
				case "neutral":
					matchedMood = "neutral"; 
					break;
				case "sadness":
					matchedMood = "depressive"; 
					break;
				case "surprise":
					matchedMood = "harsh"; 
					break;
				default: matchedMood = "chill";
			}
			return matchedMood;
		}

		// map the highest emotions to the mood-tags in Moodplay, BUT invert
		function flipMood(highestEmotion){
			var invertedMood;
			switch(highestEmotion){
				case "anger":
					invertedMood = "chill"; 
					break;
				case "contempt":
					invertedMood = "laid back"; 
					break;
				case "disgust":
					invertedMood = "pleasure"; 
					break;
				case "fear":
					invertedMood = "epic"; 
					break;
				case "happiness":
					invertedMood = "melancholy"; 
					break;
				case "neutral":
					invertedMood = "party"; 
					break;
				case "sadness":
					invertedMood = "upbeat"; 
					break;
				case "surprise":
					invertedMood = "dreamy";
					break;
				default:
					invertedMood = "apocalyptic"; 
			}
			return invertedMood;
		}