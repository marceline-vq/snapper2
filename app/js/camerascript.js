function userMedia(){
    return navigator.getUserMedia = navigator.getUserMedia   ||
                                navigator.webkitGetUserMedia ||
                                navigator.mozGetUserMedia    ||
                                navigator.msGetUserMedia     || null;

    }

// Now we can use it
if( userMedia() {
    // We can use the usermedia
    console.log("ALL IS WELL");
} else {
    // We can not use the user media.
    console.log("NOPEEE.");
}