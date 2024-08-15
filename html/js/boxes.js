function updateBoxState(){
  var items = document.querySelectorAll(".datom-box");
  loopfn(items,(function(item){
    boxInfo[item.id]['style'] = item.style;
    boxInfo[item.id]['txt'] = item.outerHTML;
  }));
}

function sendData(endpoint,data){
  console.log("Sending data: ", data);
  fetch(URL+"/"+endpoint, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  }).then(response => console.log(response.status) || response) // output the status and return response
  .then(response => response.text()) // send response body to next then chain
  .then(body => {
    let resp = JSON.parse(body);
    const handler = resp.called;
    if(resp.resp == false){console.log("Error on server side!");return;};

    switch(handler){
      case 'saveLayout':
        alert("Saved Layout successfully");
        break;
      case 'getLayouts':
        parseLayouts(resp.resp);
        break;
      case 'changeLayout':
        changeLayout(resp.resp);
        break;
      case 'newLayout':
        location.reload();
      default:
        console.log("No handler for response");
    }
  });
}

function newLayout(){
  sendData("handleReq?", {endp:"newLayout",payl:""});
}

function loopfn(list, fn){
  list.forEach((item, i) => {
    fn(item);
  });
}

function saveLayout(){
  updateBoxState();
  let payload = boxInfo;
  Object.keys(payload).forEach((item, i) => {
    delete payload[item].editor;
    delete payload[item].editelem;
  });
  console.log("Saving :", payload);
  const data = {endp:"saveLayout",payl:boxInfo};
  sendData("handleReq?",data);
}

function getLayouts(){
  const data = {endp:"getLayouts",payl:{}};
  sendData("handleReq?",data);
}

function changeLayout(data){
  console.log("changeLayout: ",data);
  location.reload();
}

function parseLayouts(layouts){
  let select = document.getElementById("file-select");
  html="<option value='null_option'>Empty Layout</option>";
  layouts.forEach((item, i) => {
    let elem = document.createElement("option");
    elem.setAttribute("value", item.filetime);
    elem.innerHTML = item.filetime;
    html+=elem.outerHTML;
  });
  select.innerHTML = html;
  select.addEventListener("change", (event) => {
    const data = {endp:"changeLayout",payl:select.value};
    sendData("handleReq?",data);
  });
}

function renderBoxDimensions(row, col, width, height){
  console.log("Rendering box dimensions", row, col, width, height);
  console.log(datomGridContainer);
}

function newBoxOld(row, col, width, height){
  console.log("Setting up new box!");
  //Generate a new box with a new ID
  //var newBox = boxTemplate;
  var newBox = boxTemplate;
  newId = newBoxId();
  newBox.id = newId;
  newBox.style.gridArea = row+" / "+col+" / "+(row+height)+" / "+(col+width);
  datomGridContainer.appendChild(newBox);
  boxInfo[newId] = {txt:newBox.outerHTML};
  createEditor(newId);
  updateBoxState();
}

function newBox(row, col, width, height){
  console.log("Setting up new box!");
  //Generate a new box with a new ID
  var newBox = boxTemplate;
  newId = newBoxId();
  newBox.id = newId;
  newBox.style.gridArea = row+" / "+col+" / "+(row+height)+" / "+(col+width);
  //add new box to the boxInfo state-holder
  boxInfo[newId] = {txt:newBox.outerHTML};
  datomGridContainer.append(newBox);
  createEditor(newId);
  updateBoxState();
  console.log(boxInfo);
}

function newBoxId(){
  var ids = Object.keys(boxInfo);
  var newIds = [];
  var newId = 1;

  if(ids.length>0){
    ids.forEach(
      function(id,i){
        newIds[i] = Number(id.split("-").slice(-1));
      });
    newId = Math.max.apply(Math, newIds)+1;
  };
  return 'datom-box-'+newId;
}

function selectContainer(elem){
  dragElement(elem);
  selectBox(elem.id);
}

function selectBox(boxid){
  var binfo = boxInfo[boxid];
  var bhead = document.getElementById(boxid).querySelector(".datom-box-header");
  console.log((binfo.clickend - binfo.clickstart));
  if((binfo.clickend - binfo.clickstart)>220){
    console.log("Click too long for select event");
  }else{
    console.log("Click is select event");
    document.querySelectorAll(".datom-box").forEach((item, i) => {
        item.querySelector(".datom-box-header").style.visibility = "hidden";
        item.setAttribute('selected', false);
      });
    document.getElementById(boxid).setAttribute("selected", true);
    bhead.style.visibility = "visible";
  };
  updateBoxState();
}

function defocusBoxes(){
  var items = document.querySelectorAll(".datom-box");
  items.forEach((item, i) => {
    item.setAttribute('selected', false);
  });
  updateBoxState();
}
