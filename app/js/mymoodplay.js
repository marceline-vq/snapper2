var textLength;

var limits;

var context;
var fadeTime = 4;
var offset = 30;
var duration = 60;

var isWebkit = /Webkit/i.test(navigator.userAgent),
	isChrome = /Chrome/i.test(navigator.userAgent),
	isMobile = !!("ontouchstart" in window),
	isAndroid = /Android/i.test(navigator.userAgent),
	isIE = document.documentMode;

function r (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var dotsHtml = "", $dots, $cursor;
var isPlaying = false;

function assignCursorEvents() {
	$("#cursor").off("mouseenter");
	$("#cursor").off("mouseleave");
	$("#cursor").off("click");
	$("#cursor").on({
		mouseenter: function() {
			$(this).addClass("cursor_hover");
			$(".cursor_hover").velocity({ boxShadowBlur:15 }, { duration: 100 });
		},
		mouseleave: function() {
			$(".cursor_hover").velocity("stop");
			$(".cursor_hover").velocity("reverse");
			$(this).removeClass("cursor_hover");

		},
		click: function() {
			if (isPlaying) {
				$("#cursorImg").removeClass("pause")
				$("#cursorImg").addClass("play");
				$("#cursorImg").velocity({ opacity: 1.0 }, { duration: 200, loop: 1 });
				isPlaying = false;
			}
			else {
				$("#cursorImg").removeClass("play")
				$("#cursorImg").addClass("pause");
				$("#cursorImg").velocity({ opacity: 1.0 }, { duration: 200, loop: 1 });
				isPlaying = true;
			}
		}
	});
}

function animate() {
	var mid;
	$dots.appendTo($container);
	$("#cursor").velocity({
		opacity: 0.75,
		translateX: (screenWidth / 2.0) + "px",
		translateY: (screenHeight / 2.0) + "px"
	});
	for (var m = 0; m < myMoodplay.moods.length; m++)
	{
		mid = "#" + myMoodplay.moods[m][0].replace(" ", "");
		$(mid).on({
			mouseenter: function() {
				$(this).velocity({ 
					colorAlpha: 1.0,
					backgroundColorAlpha: 0.2,
					fontSize: "2.0rem",
					translateX: "-=7",
					translateY: "-=7"
				}, { duration: 200 })						
			},
			mouseleave: function() {
				$(this).velocity("reverse")												
			}
		}).velocity({ 
			colorRed: myMoodplay.colors[m][0],
			colorGreen: myMoodplay.colors[m][1],
			colorBlue: myMoodplay.colors[m][2],
			colorAlpha: 0.5,
			backgroundColor: "#333",
			backgroundColorAlpha: 0.0,
			translateX: (myMoodplay.moods[m][1] * screenWidth - 20) + "px",
			translateY: (screenHeight - (myMoodplay.moods[m][2] * screenHeight) - 70) + "px"
		}, { 
			complete: function() {
				$(this).velocity({ 
					colorAlpha: 1.0,
					backgroundColorAlpha: 0.0
				}, { duration: r(200, 400), loop: 1 });
			}
		});
	}
	assignCursorEvents();
	$(document).click(function(e) {
		$("#cursor").stop(true);
		$("#cursor").velocity({
			translateX: event.pageX - 30,
			translateY: event.pageY - 30
		}, {duration: 4000});
		assignCursorEvents();
		myMoodplay.sendSPARQLQuery();
	});
}


/* Override the default easing type with something a bit more jazzy. */
$.Velocity.defaults.easing = "easeInOutsine";

/*************
    Setup
*************/

var $container = $("#container"),
	$browserWidthNotice = $("#browserWidthNotice"),
	$welcome = $("#welcome");

var screenWidth = document.documentElement.clientWidth, //window.screen.availWidth,
	screenHeight = document.documentElement.clientHeight, //window.screen.availHeight
	chromeHeight = screenHeight - (document.documentElement.clientHeight || screenHeight);

var translateZMin = -725,
	translateZMax = 0;

var containerAnimationMap = {
	perspective: [ 215, 50 ],
	opacity: [ 0.90, 0.55 ]};

var uri = MOOD_URI + "/" + LIMITS_QUERY + "?configNumber=" + configNumber;
myMoodplay.sendRequest(uri, myMoodplay.processMBResponse);

try {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext();
} catch(e) {
    throw new Error('Web Audio API not supported.');
}

myMoodplay.init();
AudioPlayer.init();

$("#metadata").velocity({
	translateY: (screenHeight - 90) + "px",
	opacity: 0
}, { duration: 10 });

$("#menuIcon").velocity({
	translateX: "20px",
	translateY: "20px",
	opacity: 0.2
}, { duration: 10 });

var moodOriginal = "depressive";
var moodInput = document.getElementById('mood_tag');
moodInput.display = "block";
moodInput.innerHTML = moodOriginal;

var currentMood = myMoodplay.moods[5][0];

for (var m = 0; m < myMoodplay.moods.length; m++)
{
	dotsHtml += "<div id='%1' class='dot'>%1</div>".replace("%1", myMoodplay.moods[m][0].replace(" ", "")).replace("%1", myMoodplay.moods[m][0]);
}
//for (var m = 0; m < myMoodplay.moods.length; m++)
//{
	//console.log(myMoodplay.moods[0][0]);
	/*if(currentMood == moodOriginal){
		console.log("mood found : " + currentMood);
		dotsHtml += "<div id='%1' class='dot'>%1</div>".replace("%1", myMoodplay.moods[0][0].replace(" ", "")).replace("%1", currentMood);	
		
	} else console.log("MOOD NOT FOUND");
	
}*/

$dots = $(dotsHtml);

$welcome.velocity({ opacity: [ 0, 0.65 ] }, { display: "none", delay: 1000, duration: 800, complete: animate });
