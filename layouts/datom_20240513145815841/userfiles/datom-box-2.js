function doTheWeenus(){
    var colors = ["red","green","blue","purple","green","limegreen","purple","orange","lightblue","maroon","fuchsia","lime","blueviolet","cornflowerblue","darkorange"];
    var inc = 0;
    var colorFlash = setInterval(function(){
        if(inc==colors.length) 
        {
            clearInterval(colorFlash);
            document.getElementById("creepyDiv").remove();
            datomContainer.style.backgroundColor = "#d9d9d9";
        }
        document.getElementById("datom-container").style.backgroundColor = colors[inc];
        inc++;
    }, 400);
    var audio = new Audio('audio/wdh.mp3');
    audio.play();
    var eyes = document.createElement("div");
    eyes.id = "creepyDiv";
    eyes.classList.add("bouncing-div");
    eyes.innerHTML = "<img src='img/big-eyes.gif' width=300; height=200>";
    document.getElementById("datom-box-2").querySelector(".datom-box-body").append(eyes);
}

document.getElementById("weenusButton").addEventListener('click', function(e){
    doTheWeenus();
});









