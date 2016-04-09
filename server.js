

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
			message : "FUCK YOU."
		});
	});

	app.post("/savefile", function(request, response){

		console.log("payload received, now about to do stuff...");

		var imageData = request.body.data;
		var imgPath = "app/snaps/photo.png";
		var highestEmotion;
		//console.log(highestEmotion);
		fs.writeFile(imgPath, imageData, 'base64', function(err) {
			
			if(err) console.log(err);
			else { 
				/*console.log("yay, that worked");
				response.send("snaps/photo.png");*/

		/*		var emotion = emotionAPI.recognize("image", imgPath, function(cb) {
    				console.log(cb);
  				});*/

  				client.emotion.analyzeEmotion({
    				path: imgPath,
				}).then(function (result) {
    				//console.log(response.scores);
					var emotions = result[0].scores;
					var anger = emotions.anger;
					console.log("anger " + anger);
					
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
					response.send({
						emotion : highestEmotion, 
						value : highestValue
					});
					console.log("highest emotion : " + highestEmotion);
						
					console.log("highest value : " + highestValue);

				});

						// convert the json results to a string and display in the html
			//function ProcessResult(response){

			}
  			
		});

		/*fs.writeFile("POOK-out.png", imageData, 'base64', function(err) {
  			console.log(err);
		});*/

	});




	app.listen(PORT, function() {
		console.log('moodplay server started at http://localhost:' + PORT);
	});
	
}).call(this);
