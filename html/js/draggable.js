function dragElement(elmnt) {
  console.log("Drag elmnt", elmnt);
  let containerWidth = datomContainer.offsetWidth;
  let containerHeight = datomContainer.offsetHeight;
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  elmnt.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;

    const bottom = elmnt.offsetTop + elmnt.offsetHeight;
    const right = elmnt.offsetLeft + elmnt.offsetWidth;
    console.log("Bottom-right is at: ", bottom, right);
    console.log("Mouse position is: ", pos4, pos3);

    if ((bottom - pos4 < 15) && (right - pos3 < 15) && (elmnt.getAttribute("selected") === 'true')) {
      console.log("Click within resize area!");
      document.onmousemove = elementResize;
    } else {
      console.log("Click outside of resize area");
      const id = elmnt.id;
      boxInfo[id]['clickstart'] = Date.now();
      document.onmousemove = elementDrag;
    }
    document.onmouseup = closeDragElement;
  }

  function elementResize(e) {
    console.log("Resizing element!");
    e = e || window.event;
    e.preventDefault();
    const posx = e.clientX;
    const posy = e.clientY;
    var xv = posx - elmnt.offsetLeft;
    var yv = posy - elmnt.offsetTop;
    var newwidth = Math.round(1000*xv/containerWidth)/10;
    var newheight = Math.round(1000*yv/containerHeight)/10;
    elmnt.style.width = newwidth + "%";
    elmnt.style.height = newheight + "%";
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement(e) {
    e = e || window.event;
    e.preventDefault();
    const id = elmnt.id;
    boxInfo[id]['clickend'] = Date.now();
    selectBox(id);
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function generateDayWiseTimeSeries(baseval, count, yrange) {
  var i = 0;
  var series = [];
  while (i < count) {
    var x = baseval;
    var y =
      Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

    series.push([x, y]);
    baseval += 86400000;
    i++;
  }
  return series;
}
