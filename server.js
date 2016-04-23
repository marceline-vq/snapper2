

(function() {
	var express = require('express');
	var fs = require('fs');
	var bodyParser = require("body-parser");
	var app = express();
	var apiKey = "fca2ec21f98743a69255528052fc2aea";
	//var emotionAPI = require("node-oxford-emotion")(apiKey);
	var oxford = require('project-oxford'),
    client = new oxford.Client(apiKey);

	var PORT = 8050;
	app.use(express["static"](__dirname + '/app'));
	//app.use(bodyParser.json()); 
	app.use(bodyParser.json({limit: '50mb'}));
	console.log("startin the serverrrrr now");


	app.get("/savefile", function(request, response){
		console.log("get a save file");
		response.send({
			message : "saving file."
		});
	});

	app.post("/savefile", function(request, response){

		console.log("payload received, now about to do stuff...");

		var imageData = request.body.data;
		var imgPath = "app/snaps/photo.png";
		var highestEmotion;
		var matchedMood;
		var flippedMood;
		//console.log(highestEmotion);
		fs.writeFile(imgPath, imageData, 'base64', function(err) {
			
			if(err) console.log(err);
			else { 
				/*console.log("yay, that worked");
				response.send("snaps/photo.png");*/

		/*		var emotion = emotionAPI.recognize("image", imgPath, function(cb) {
    				console.log(cb);
  				});*/
  				//console.log("#1. BEFORE ANALYSING WITH API Client");
  				client.emotion.analyzeEmotion({
    				path: imgPath,
				}).then(function (result) {
    				//console.log(response.scores);
    				console.log(result);
					var emotions = result[0].scores;
					var anger = emotions.anger;
					
					var highestValue = -1;
					var emotionName;
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

					matchedMood = selectMood(highestEmotion);
					flippedMood = flipMood(highestEmotion);
				//	console.log("#3. server.js BEFORE responses (emotion/value/mood) are sent");
					response.send({
						emotion : highestEmotion, 
						value : highestValue,
						mood : matchedMood,
						invertedMood : flippedMood,
					});
					
					console.log("highest emotion : " + highestEmotion);
					console.log("highest value : " + highestValue);
					console.log("mood : " + matchedMood);
					console.log("inverted mood : " + flippedMood);

				});
			}
  			
		});
	});

    moods: [
        ['pathetic',0.12,0.27,0,0],
        ['dark',0.12,0.38,0,0],
        ['apocalyptic',0.12,0.49,0,0],
        ['terror',0.02,0.56,0,0],
        ['depressive',0.21,0.20,0,0],
        ['cold',0.32,0.40,0,0],
        ['scary',0.22,0.69,0,0],
        ['melancholy',0.38,0.11,0,0],
        ['sad',0.41,0.04,0,0],
        ['haunting',0.33,0.26,0,0],
        ['neutral',0.5,0.5,0,0],
        ['angry',0.36,0.78,0,0],
        ['slow',0.54,0.07,0,0],
        ['epic',0.54,0.33,0,0],
        ['quirky',0.63,0.77,0,0],
        ['chill',0.71,0.00,0,0],
        ['mellow',0.68,0.09,0,0],
        ['soft',0.74,0.18,0,0],
        ['smooth',0.82,0.21,0,0],
        ['party',0.86,0.84,0,0],
        ['energetic',0.73,0.65,0,0],
        ['laid back',0.86,0.12,0,0],
        ['easy',0.95,0.21,0,0],
        ['uplifting',0.90,0.44,0,0],
        ['happy',0.92,0.52,0,0],
        ['upbeat',0.91,0.6,0,0]
    ],


	app.listen(PORT, function() {
		console.log('moodplay server started at http://localhost:' + PORT);
	});
	
}).call(this);

		// MATCH THE EMOTION WITH THE MOODSCALE
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
					matchedMood = "upbeat";
					break;
				case "neutral":
					matchedMood = "neutral";
					break;
				case "sadness":
					matchedMood = "depressive";
					break;
				case "surprise":
					matchedMood = "epic";
					break;
				default: matchedMood = "chill";
			}
			return matchedMood;
		}
		// INVERT THE EMOTION TO THE OPPOSITE
		function flipMood(highestEmotion){
			var invertedMood;
			switch(highestEmotion){
				case "anger":
					invertedMood = "mellow";
					break;
				case "contempt":
					invertedMood = "laid back";
					break;
				case "disgust":
					invertedMood = "smooth";
					break;
				case "fear":
					invertedMood = "slow";
					break;
				case "happiness":
					invertedMood = "melancholy";
					break;
				case "neutral":
					invertedMood = "quirky";
					break;
				case "sadness":
					invertedMood = "uplifting";
					break;
				case "surprise":
					invertedMood = "easy";
					break;
				default:
					invertedMood = "apocalyptic";
			}
			return invertedMood;
		}