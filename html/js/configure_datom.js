// Shared state + boot. Loaded last; every other file only declares functions.

const API = "http://" + window.location.host + "/handleReq?"
const editorModal = document.getElementById("editorModal")
const grid = document.getElementById("datom-grid-container")

// boxInfo[id] = {txt, html, js, css, q, lang} -- txt is the persisted outerHTML
const boxInfo = {}

const LANGS = ["html", "js", "css", "q"]
const lang_map = { html: "html", js: "javascript", css: "css", q: "text" }

// Grid size lives in CSS (--cols/--rows) so the stylesheet and the maths agree.
const gridStyle = getComputedStyle(grid)
const COLS = Number(gridStyle.getPropertyValue("--cols"))
const ROWS = Number(gridStyle.getPropertyValue("--rows"))

let boxTemplate

// Fetch a file, or null if it isn't there. (Previously returned the string
// "error", which collided with any file whose contents were "error".)
async function loadFile(fname) {
  const response = await fetch(fname)
  return response.ok ? response.text() : null
}

function parseHTML(html) {
  return new DOMParser().parseFromString(html, "text/html")
}

async function loadBoxTemplate() {
  const res = await loadFile("datom-grid-box-template.html")
  if (!res) throw new Error("missing datom-grid-box-template.html")
  boxTemplate = parseHTML(res).getElementById("datom-box-template")
}

// Restore saved boxes: insert, wire up, pull each box's code, then render.
async function loadContainers() {
  const res = await loadFile("userfiles/datom-containers.html")
  if (!res) return
  const saved = [...parseHTML(res).querySelectorAll(".datom-box")]
  for (const box of saved) {
    box.querySelector(".datom-box-body").innerHTML = ""
    grid.appendChild(box)
    boxInfo[box.id] = { lang: "html", html: "", js: "", css: "", q: "" }
    attachBox(box)
  }
  // Wait for the code to actually arrive instead of a 100ms guess.
  await Promise.all(saved.map(box => loadEditorCode(box.id)))
  saved.forEach(box => renderBox(box.id))
  updateBoxState()
}

function toast(msg) {
  const el = document.getElementById("toast")
  el.textContent = msg
  el.classList.add("show")
  setTimeout(() => el.classList.remove("show"), 2200)
}

;(async function boot() {
  ace.require("ace/ext/language_tools")
  initEditor()

  document.getElementById("btn-new-layout").addEventListener("click", newLayout)
  document.getElementById("btn-save-layout").addEventListener("click", saveLayout)
  document.getElementById("btn-delete-layout").addEventListener("click", deleteLayout)
  // Bound once here; parseLayouts() used to stack a new listener on every call.
  document.getElementById("file-select").addEventListener("change", changeLayout)

  try {
    await Promise.all([loadBoxTemplate(), loadContainers()])
  } catch (err) {
    console.error(err)
    toast("Failed to load layout: " + err.message)
    return
  }
  // Only now can a grid click build a box, so wire the grid last.
  initGrid()
  await getLayouts()
})()
