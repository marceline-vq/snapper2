var configNumber = 4;
var MOOD_URI = "http://127.0.0.1:8070";
var LIMITS_QUERY = "coordinateLimits";
var COORD_QUERY = "findNearestTrack";
var METADATA_QUERY = "getLocalMetadata";
var MB_QUERY = "getMusicbrainzMetadata";
var AUDIO_SERVICE = "loadAudioFile";
var AUDIO_BASE_URI = "http://localhost/ilmaudio/mp3/";

var myMoodplay = {
    moods: [
        ['pathetic',0.12,0.27,0,0],
        ['dark',0.12,0.38,0,0],
        ['apocalyptic',0.12,0.49,0,0],
        ['harsh',0.04,0.68,0,0],
        ['terror',0.02,0.56,0,0],
        ['depressive',0.21,0.20,0,0],
        ['cold',0.32,0.40,0,0],
        ['scary',0.22,0.69,0,0],
        ['melancholy',0.38,0.11,0,0],
        ['sad',0.41,0.04,0,0],
        ['deep',0.46,0.24,0,0],
        ['haunting',0.33,0.26,0,0],
        ['neutral',0.5,0.5,0,0],
        ['angry',0.36,0.78,0,0],
        ['brutal',0.26,0.90,0,0],
        ['slow',0.54,0.07,0,0],
        ['dreamy',0.50,0.16,0,0],
        ['epic',0.54,0.33,0,0],
        ['nostalgia',0.60,0.23,0,0],
        ['pure',0.58,0.39,0,0],
        ['free',0.60,0.45,0,0],
        ['sexy',0.60,0.57,0,0],
        ['quirky',0.63,0.77,0,0],
        ['chill',0.71,0.00,0,0],
        ['mellow',0.68,0.09,0,0],
        ['soft',0.74,0.18,0,0],
        ['smooth',0.82,0.21,0,0],
        ['sweet',0.75,0.36,0,0],
        ['pleasure',0.78,0.44,0,0],
        ['party',0.86,0.84,0,0],
        ['energetic',0.73,0.65,0,0],
        ['fun',0.84,0.69,0,0],
        ['humour',0.77,0.79,0,0],
        ['laid back',0.86,0.12,0,0],
        ['easy',0.95,0.21,0,0],
        ['soulful',0.94,0.29,0,0],
        ['uplifting',0.90,0.44,0,0],
        ['happy',0.92,0.52,0,0],
        ['upbeat',0.91,0.6,0,0]
    ],

    colors: [
        [ 29, 33, 255 ],
        [ 94, 52, 255 ],
        [ 153, 61, 255 ],
        [ 255, 11, 11 ],
        [ 255, 8, 8 ],
        [ 42, 99, 255 ],
        [ 152, 150, 255 ],
        [ 255, 83, 83 ],
        [ 42, 180, 255 ],
        [ 18, 196, 255 ],
        [ 121, 235, 255 ],
        [ 119, 177, 255 ],
        [ 255, 255, 255 ],
        [ 255, 96, 96 ],
        [ 255, 17, 17 ],
        [ 50, 255, 236 ],
        [ 82, 255, 255 ],
        [ 166, 255, 235 ],
        [ 108, 255, 205 ],
        [ 182, 255, 214 ],
        [ 193, 255, 198 ],
        [ 255, 250, 193 ],
        [ 255, 168, 102 ],
        [ 0, 255, 158 ],
        [ 27, 255, 165 ],
        [ 51, 255, 130 ],
        [ 35, 255, 80 ],
        [ 111, 255, 109 ],
        [ 158, 255, 101 ],
        [ 255, 186, 12 ],
        [ 255, 248, 115 ],
        [ 255, 251, 58 ],
        [ 255, 198, 53 ],
        [ 0, 255, 64 ],
        [ 0, 255, 8 ],
        [ 32, 255, 20 ],
        [ 112, 255, 47 ],
        [ 158, 255, 41 ],
        [ 188, 255, 42 ]    
    ],
 
    init: function() {
        myMoodplay.playlist = Array();
    },
    
    sendRequest: function(uri, callback) {
        var request = new XMLHttpRequest();
        request.open('GET', uri, true); 
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.onreadystatechange = function() {
            if(request.readyState == 4) {
                if(request.status == 200) {
                    callback(request.responseText);
                } else {
                    alert("Query error: " + request.status + " " + request.responseText);
                }
            }
        };
        request.send(null);
    },

    processLimitsResponse: function(json) {
        var dict = jQuery.parseJSON(json);
        limits = {};
        limits.vmin = parseFloat(dict[0].vmin.value);
        limits.vmax = parseFloat(dict[0].vmax.value);
        limits.amin = parseFloat(dict[0].amin.value);
        limits.amax = parseFloat(dict[0].amax.value);
    },

    processMoodResponse: function(json) {
        var dict = jQuery.parseJSON(json);
        var mbid = dict[0].mbid.value;
        var path = dict[0].path.value;
        myMoodplay.path = path;
        myMoodplay.mbid = mbid;
        //myMoodplay.sendRequest(MOOD_URI + "/" + MB_QUERY + "?mbid=" + mbid, myMoodplay.processMBResponse);
        myMoodplay.sendRequest(MOOD_URI + "/" + METADATA_QUERY + "?filename=" + myMoodplay.path, myMoodplay.processMetadataResponse);
        var uri = AUDIO_BASE_URI + path.replace(".wav", ".mp3");
        myMoodplay.processAudioResponse(uri);
    },

    processMetadataResponse: function(json) {
        var dict = jQuery.parseJSON(json);
        //myMoodplay.showMetadata(dict[0].title.value, dict[0].artist.value, dict[0].album.value, dict[0].year.value);
    },

    processAudioResponse: function(fileuri) {
        AudioPlayer.loadTrack(fileuri);
    },

    processMBResponse: function(json) {
        var dict = jQuery.parseJSON(json);
        if (title in dict)
        {
            var title, artist, album, date;
            title = dict.title;
            artist = dict['artist-credit'][0].artist.name;
            album = dict['releases'][0].title;
            date = new Date(dict['releases'][0].date);
            myMoodplay.showMetadata(title, artist, album, date.year);
        }
        else
        {
            myMoodplay.sendRequest(MOOD_URI + "/" + METADATA_QUERY + "?filename=" + myMoodplay.path, myMoodplay.processMetadataResponse);
        }
    },

    sendSPARQLQuery: function(x, y) {
       // myMoodplay.clear();
        var v = myMoodplay.linlin(x, 0.0, 1.0, limits.vmin, limits.vmax);
        var a = myMoodplay.linlin(y, 0.0, 1.0, limits.amin, limits.amax);
        var uri = MOOD_URI + "/" + COORD_QUERY + "?valence=" + v + "&arousal=" + a;
        this.sendRequest(uri, this.processMoodResponse);
    },

    linlin: function(val, inmin, inmax, outmin, outmax) {
        if (val <= inmin) return outmin;
        if (val >= inmax) return outmax;
        return (val - inmin) / (inmax-inmin) * (outmax-outmin) + outmin;
    },

    clear: function() {
        $("#filename").text("");  
        $("#title").text("");
        $("#artist").text("");
        $("#album").text("");
        $("#year").text("");
    },

    fadeTrack: function(path) {
        $("#filename").text(path);
    },

    showMetadata: function(title, artist, album, year) {
        $("#title").text(title);
        $("#artist").text(artist);
        $("#album").text(album);
        if (year > 0) $("#year").text(year);
        /*$("#metadata").velocity({ 
            opacity: 1.0
        }, { duration: 1000 }).velocity({
            opacity: 0.0
        }, { delay: 3000, duration: 1000 });*/
    }
}