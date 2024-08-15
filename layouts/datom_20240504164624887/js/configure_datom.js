const URL = "http://"+window.location.host
const editorModal = document.getElementById("editorModal")
const editorTemplate = editorModal.innerHTML
let datomContainer = document.getElementById('datom-container')
let current_editor = null
let editors = {}
let boxInfo = {} //{ID:{style: '...',selected:true}}
const lang_map = {
  html_lang:"html",
  js_lang:'javascript',
  css_lang:'css',
  q_lang: 'javascript'
}
var boxTemplate

//Load a file from the server
async function loadHtml(fname) {
  console.log("Loading html file: ",fname);
  const response = await fetch(fname);
  if(response.status !== 200){
    return"error";
  }else{
    const text = await response.text();
    return text;
  }
}

//Convert HTML string to HTML objects
function parseHTML(html){
  var parser = new DOMParser();
  return parser.parseFromString(html, "text/html");
}

function loadBoxTemplateHTML(){
  //Load template HTML used for new boxes
  const htmls = loadHtml("datom-box-template.html").then((res) => {
    var reselem = parseHTML(res);
    boxTemplate = reselem.getElementById("datom-box-template");
  });
}

function loadContainerHTML(){
  //Load any already stored boxes, insert to DOM, create editor for each, load editor code from server
  const htmlb = loadHtml("userfiles/datom-containers.html").then((res) => {
    var reselem = parseHTML(res);
    console.log("Datom containers!", reselem);
    if(reselem.body.innerHTML !== "error"){
      reselem = reselem.querySelectorAll(".datom-box");
      datomContainer.innerHTML = '';
      loopfn(reselem,(function(item,i){
        datomContainer.appendChild(item);
        boxInfo[item.id] = {};
        dragElement(item);
        createEditor(item.id);
        loadEditorCode(item.id);
        boxInfo[item.id]['lang'] = 'html';
      }));
      updateBoxState();
    }
    getLayouts();
  });
}

//Document ready
(function(){
  console.log("Document ready!");
  ace.require("ace/ext/language_tools");
  loadBoxTemplateHTML();
  loadContainerHTML();
  setTimeout(function() {
    renderCustomCode();
  }, 100);
})();
