// One persistent ace instance shared by every box. The old code created an
// editor per box inside the modal, then wiped the modal's innerHTML right
// after ace attached to it, detaching the editor it had just built.

let editor
let editingId = null

const prefersDark = matchMedia("(prefers-color-scheme: dark)")
const aceTheme = () => "ace/theme/" + (prefersDark.matches ? "tomorrow_night" : "textmate")

function initEditor() {
  editor = ace.edit(document.getElementById("editorHost"))
  editor.setTheme(aceTheme())
  prefersDark.addEventListener("change", () => editor.setTheme(aceTheme()))
  editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true,
    fontSize: 13
  })
  editor.commands.addCommand({
    name: "apply",
    bindKey: { win: "Ctrl-S", mac: "Cmd-S" },
    exec: () => { stashEditor(); renderBox(editingId) }
  })

  document.querySelectorAll(".lang_icon").forEach(btn =>
    btn.addEventListener("click", () => showLang(btn.dataset.lang)))
  // Stash here too: the close event is the only path for Esc, but relying on
  // it alone leaves the buffer's fate to async event timing.
  document.getElementById("btn-close-editor")
    .addEventListener("click", () => { stashEditor(); editorModal.close() })
  editorModal.addEventListener("close", () => {
    stashEditor()          // idempotent
    renderBox(editingId)
    editingId = null
  })
}

function stashEditor() {
  if (editingId && boxInfo[editingId]) {
    boxInfo[editingId][boxInfo[editingId].lang] = editor.getValue()
  }
}

// Point the editor at a language. No stash -- the caller decides whether the
// current buffer belongs to the box we are about to leave.
function loadLang(lang) {
  if (!editingId) return
  boxInfo[editingId].lang = lang
  // The old changeEditorScript looked the mode up and then never applied it,
  // so every tab stayed on javascript highlighting.
  editor.session.setMode("ace/mode/" + lang_map[lang])
  editor.setValue(boxInfo[editingId][lang] || "", -1)
  document.querySelectorAll(".lang_icon").forEach(b =>
    b.setAttribute("aria-pressed", String(b.dataset.lang === lang)))
}

// Tab click: the buffer still belongs to this box, so keep it.
function showLang(lang) {
  if (!editingId) return
  stashEditor()
  loadLang(lang)
}

function openEditor(id) {
  stashEditor()   // flush the previous box BEFORE editingId moves, or its
  editingId = id  // buffer gets written into the box we are opening
  document.getElementById("editor-target").textContent = id
  loadLang(boxInfo[id].lang || "html")
  editorModal.showModal()
  editor.resize()
  editor.focus()
}

async function loadEditorCode(id) {
  const files = await Promise.all(LANGS.map(l => loadFile(`userfiles/${id}.${l}`)))
  // q's 0: terminates the file with a newline; drop exactly one so a
  // save/load round trip is idempotent instead of growing a blank line.
  LANGS.forEach((l, i) => boxInfo[id][l] = (files[i] || "").replace(/\n$/, ""))
}

// Render one box. This used to re-render and re-eval every box on every save,
// which is what stacked duplicate charts on top of each other.
function renderBox(id) {
  const box = document.getElementById(id)
  if (!box || !boxInfo[id]) return

  box.querySelector(".datom-box-body").innerHTML = boxInfo[id].html || ""

  let sheet = document.getElementById("css_" + id)
  if (!sheet) {
    sheet = document.createElement("style")
    sheet.id = "css_" + id
    document.head.appendChild(sheet)
  }
  sheet.textContent = boxInfo[id].css || ""

  try {
    new Function(boxInfo[id].js || "")()
  } catch (err) {
    console.error(`[${id}] js:`, err)   // one bad box must not stop the others
  }
}
