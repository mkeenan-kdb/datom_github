function renderHTML(){
  Object.keys(boxInfo).forEach((item) => {
    document.getElementById(item).querySelector(".datom-box-body").innerHTML = boxInfo[item].html;
  });
}

function renderCSS(){
  Object.keys(boxInfo).forEach((item) => {
    var newid = "css_"+item;
    var newsheet = document.getElementById(newid);
    if(!newsheet){
      console.log("There is no existing stylesheet. Creating it!");
      newsheet = document.createElement("style");
      newsheet.id = newid;
      document.head.appendChild(newsheet);
    }
    document.getElementById(newid).remove();
    boxInfo[item]['cssid'] = newid;
    console.log("Adding edtitor css to head of document");
    newsheet.innerText = boxInfo[item].css;
    document.head.appendChild(newsheet);
  });
}

function renderJS(){
  Object.keys(boxInfo).forEach((item) => {
    eval(boxInfo[item].js);
  });
}

function renderCustomCode(){
  renderHTML();
  renderCSS();
  renderJS();
}

function setEditorMode(elem){
  let lang = lang_map[elem.value];
  console.log("setting language to: ",lang);
  current_editor.session.setMode("ace/mode/"+lang);
}

function loadEditorCode(id){
  console.log("loading editor code for: ",id);
  var langs = ["js","css","q","html"];
  langs.forEach((item) => {
    var code = loadHtml("userfiles/"+id+"."+item).then((res) => {
      if(res == "error") res = "";
      boxInfo[id][item] = res;
      //if(item == "css") renderCSS();
      //if(item == "js") renderJS();
      //if(item == "html") renderHTML();
    });
  });
}

function changeEditorScript(newlang){
  var editid = (editorModal.querySelectorAll(`[id^=${"editor_datom"}]`)[0]).id;
  var parentid = editid.split("_")[1];
  var lang = newlang.split("_")[0];
  boxInfo[parentid]['lang'] = lang;
  newlang = lang_map[newlang];
  boxInfo[parentid].editor.setValue(boxInfo[parentid][lang]);
  console.log("setting language to: ",newlang);
}

function storeEditorContents(editor){
  var parentid = editor.container.id.split("_")[1];
  var currlang = boxInfo[parentid]['lang'];
  boxInfo[parentid][currlang] = editor.session.getValue();
  renderCustomCode();
  console.log("successfully stored editor contents for lang: "+currlang+" for container: ",parentid);
}

function createEditor(id){
  console.log("Creating editor on load for, ", id);
  let neweditor = document.createElement("div");
  let newid = "editor_"+id;
  neweditor.id = newid;
  editorModal.innerHTML = editorTemplate;
  editorModal.appendChild(neweditor);
  let edit = ace.edit(newid);
  edit.setTheme("ace/theme/monokai");
  edit.session.setMode("ace/mode/javascript");
  edit.setOption('enableBasicAutocompletion', true);
  edit.setOption('enableSnippets', true);
  edit.setOption('enableLiveAutocompletion', true);
  edit.commands.addCommand({
    name: 'save',
    bindKey: {win: "Ctrl-S", "mac": "Cmd-S"},
    exec: function(editor) {
      storeEditorContents(editor);
    }
  });
  boxInfo[id]['editelem'] = neweditor;
  boxInfo[id]['editelemid'] = newid;
  boxInfo[id]['editor'] = edit;
  boxInfo[id]['lang'] = 'html';
  editorModal.innerHTML = editorTemplate;
  return;
}

function openEditorModal(elem){
  var containerid = elem.closest(".datom-box").id;
  editorModal.innerHTML = editorTemplate;
  editorModal.appendChild(boxInfo[containerid].editelem);
  changeEditorScript(boxInfo[containerid].lang);
  editorModal.showModal();
  console.log(containerid);
}
