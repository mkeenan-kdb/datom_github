// Box lifecycle + server IO.

const BOX_W = 12, BOX_H = 8

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

function setArea(el, row, col, w, h) {
  el.style.gridArea = `${row} / ${col} / ${row + h} / ${col + w}`
}

function getArea(el) {
  const [row, col, rowEnd, colEnd] = el.style.gridArea.split(" / ").map(Number)
  return { row, col, w: colEnd - col, h: rowEnd - row }
}

function newBoxId() {
  const nums = Object.keys(boxInfo).map(id => Number(id.split("-").pop()))
  return "datom-box-" + (nums.length ? Math.max(...nums) + 1 : 1)
}

function newBox(row, col, w = BOX_W, h = BOX_H) {
  // cloneNode, not the template itself: appendChild MOVES a node, so reusing
  // the template teleported the previous box instead of making a new one.
  const box = boxTemplate.cloneNode(true)
  box.id = newBoxId()
  setArea(box, row, col, clamp(w, 1, COLS + 1 - col), clamp(h, 1, ROWS + 1 - row))
  grid.appendChild(box)
  // Seed every language: the server writes one file per language and blows up
  // on a missing key, so a never-edited box used to break saveLayout. The html
  // and js are starter content -- an empty box renders as a blank rectangle and
  // gives querySelector nothing to find, which is a confusing first five minutes.
  boxInfo[box.id] = { lang: "html", q: "", ...starterCode() }
  attachBox(box)
  selectBox(box.id)
  renderBox(box.id)
  updateBoxState()
  return box
}

function starterCode() {
  return {
    html: '<div class="content">New box</div>',
    css: ".content{display:grid;place-content:center;height:100%;opacity:.55;font-size:13px}",
    js: [
      "// Three things are in scope here:",
      "//   data  the result of the q tab, as JSON (null when the q tab is empty)",
      "//   body  this box's content element -- what the html tab fills",
      "//   box   the whole box, header and all (box.id, box.__timer, ...)",
      "//",
      "// Scope selectors to body, not box: box also contains the header, so",
      "// box.querySelector('div') matches the drag bar rather than your markup.",
      "//",
      "// body.querySelector('.content').textContent = data",
      ""
    ].join("\n")
  }
}

function deleteBox(id) {
  document.getElementById(id)?.remove()
  document.getElementById("css_" + id)?.remove()
  delete boxInfo[id]
  updateBoxState()
}

// Wire a box element: drag, resize, buttons, selection. Called for new boxes
// and for restored ones, so saved markup needs no inline onclick handlers.
function attachBox(box) {
  box.addEventListener("pointerdown", () => selectBox(box.id))
  box.querySelector(".datom-box-header")
     .addEventListener("pointerdown", e => startDrag(e, box, "move"))
  box.querySelector(".datom-box-resize")
     .addEventListener("pointerdown", e => startDrag(e, box, "resize"))
  box.querySelector(".datom-edit")
     .addEventListener("click", e => { e.stopPropagation(); openEditor(box.id) })
  box.querySelector(".datom-delete")
     .addEventListener("click", e => { e.stopPropagation(); deleteBox(box.id) })
}

function selectBox(id) {
  document.querySelectorAll(".datom-box")
    .forEach(b => b.setAttribute("selected", String(b.id === id)))
}

// Persist geometry only. The body is rebuilt from the box's .html file on load,
// so strip it here rather than saving eval'd chart DOM into the layout.
function updateBoxState() {
  document.querySelectorAll(".datom-box").forEach(box => {
    if (!boxInfo[box.id]) return
    const clone = box.cloneNode(true)
    clone.querySelector(".datom-box-body").innerHTML = ""
    boxInfo[box.id].txt = clone.outerHTML
  })
}

// Last server-side error text. A q snippet may legitimately return null, so
// callers need this to tell "returned nothing" from "blew up".
let lastServerError = ""

async function sendData(data) {
  console.log("→", data.endp, data.payl)
  lastServerError = ""
  const response = await fetch(API, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-type": "application/json; charset=UTF-8" }
  })
  if (!response.ok) {
    lastServerError = "HTTP " + response.status
    toast(lastServerError)
    return null
  }
  const resp = JSON.parse(await response.text())
  lastServerError = resp.err || ""
  if (resp.err) { toast("Server error: " + resp.err); return null }
  return resp.resp
}

const layoutSelect = () => document.getElementById("file-select")

// The dropdown always shows the layout being served, so its value is the save
// target: saving an open layout rewrites it instead of spawning a copy.
function currentLayout() {
  const v = layoutSelect().value
  return v === "null_option" ? "" : v
}

// A layout name is a directory name, so anything outside [A-Za-z0-9_-] becomes
// a dash. The server applies the same whitelist -- doing it here too is only so
// the prompt and the overwrite check agree with what lands on disk.
function cleanName(raw) {
  return raw.trim().replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "")
}

function suggestName() {
  const taken = new Set([...layoutSelect().options].map(o => o.value))
  let n = 1, name = "dashboard"
  while (taken.has(name)) name = "dashboard-" + ++n
  return name
}

// "" means the user backed out; every caller treats that as cancel.
function askName() {
  const raw = prompt("Name this dashboard", suggestName())
  if (raw === null) return ""
  const name = cleanName(raw)
  if (!name) { toast("Names need at least one letter or number"); return "" }
  const taken = [...layoutSelect().options].some(o => o.value === name)
  if (taken && !confirm(`"${name}" already exists.\n\nOverwrite it?`)) return ""
  return name
}

async function saveLayout() {
  updateBoxState()
  const boxes = {}
  // Explicit whitelist. The old version deleted keys straight out of boxInfo,
  // which corrupted the live state after the first save.
  for (const [id, b] of Object.entries(boxInfo)) {
    boxes[id] = { txt: b.txt, html: b.html || "", js: b.js || "", css: b.css || "", q: b.q || "" }
  }
  // Saving an open layout rewrites it; a new one asks for a name first.
  const open = currentLayout()
  const name = open || askName()
  if (!name) return
  const saved = await sendData({ endp: "saveLayout", payl: { boxes, name } })
  if (!saved) return
  toast(open ? `Updated ${saved}` : `Saved as ${saved}`)
  await getLayouts()   // refresh the list; the server reports the new current
}

async function deleteLayout() {
  const name = currentLayout()
  if (!name) return
  if (!confirm(`Delete layout ${name}?\n\nThis removes its files from disk and cannot be undone.`)) return
  if (await sendData({ endp: "deleteLayout", payl: name })) location.reload()
}

async function newLayout() {
  if (await sendData({ endp: "newLayout", payl: "" })) location.reload()
}

async function changeLayout(e) {
  // Picking "Empty layout" goes back to the blank canvas rather than doing nothing.
  const endp = e.target.value === "null_option" ? "newLayout" : "changeLayout"
  if (await sendData({ endp, payl: e.target.value })) location.reload()
}

// Server reports both the list and which one it is serving, so a reload
// reopens the dropdown on the right layout instead of resetting to blank.
async function getLayouts() {
  const r = await sendData({ endp: "getLayouts", payl: {} }) || {}
  const select = layoutSelect()
  select.replaceChildren(
    new Option("Empty layout", "null_option"),
    ...(r.layouts || []).map(n => new Option(n, n))
  )
  select.value = r.current || "null_option"
  document.getElementById("btn-delete-layout").disabled = !currentLayout()
}
