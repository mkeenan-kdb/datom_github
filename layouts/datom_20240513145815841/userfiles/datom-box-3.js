function doggy(){
    var audio = new Audio('audio/dogbark.mp3');
    audio.play();
}

document.getElementById("doggyButton").addEventListener('click', function(e){
    doggy();
})












