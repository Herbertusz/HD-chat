/* global HD LZString */

"use strict";

HD.DOM(document).event("DOMContentLoaded", function(){

    const constraints = {
        video : true,
        audio : false
    };

    const video = HD.DOM('#webcam-local').elem();

    const getPicture = function(videoElement, maxWidth, maxHeight){
        let width = videoElement.clientWidth;
        let height = videoElement.clientHeight;
        const videoWidth = videoElement.clientWidth;
        const videoHeight = videoElement.clientHeight;
        const ratio = videoWidth / videoHeight;
        if (typeof maxWidth !== "undefined"){
            width = (videoWidth <= maxWidth) ? videoWidth : maxWidth;
            height = width / ratio;
        }
        if (typeof maxHeight !== "undefined" && height > maxHeight){
            height = maxHeight;
            width = height * ratio;
        }
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL();
    };

    const successCallback = function(stream){
        console.log(stream.getVideoTracks());
        video.src = window.URL ? window.URL.createObjectURL(stream) : stream;
        window.setTimeout(function(){
            const base64 = getPicture(video, 200, 150);
            document.body.innerHTML += `<img src="${base64}" />`;

            console.log(base64.length);
            const compressed = LZString.compress(base64);
            console.log(compressed.length);
            const t1 = Date.now();
            const base64_2 = LZString.decompress(compressed);
            console.log(Date.now() - t1);
            // console.log(base64_2.length);
        }, 3000);
    };

    const errorCallback = function(error){
        console.log('navigator.getUserMedia error: ', error);
    };

    if (navigator.mediaDevices.getUserMedia){
        navigator.mediaDevices.getUserMedia(constraints)
            .then(successCallback)
            .catch(errorCallback);
    }
    else {
        navigator.webkitGetUserMedia(constraints, successCallback, errorCallback);
    }

});
