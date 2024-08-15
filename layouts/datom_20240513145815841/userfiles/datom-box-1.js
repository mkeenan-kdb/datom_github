function flushToilet(){
    var audio = new Audio('audio/flush.wav');
    audio.play();
}

document.getElementById("flushButton").addEventListener('click', function(e){
    flushToilet();
})












