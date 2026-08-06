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
  // on a missing key, so a never-edited box used to break saveLayout.
  boxInfo[box.id] = { lang: "html", html: "", js: "", css: "", q: "" }
  attachBox(box)
  selectBox(box.id)
  updateBoxState()
  return box
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

async function saveLayout() {
  updateBoxState()
  const boxes = {}
  // Explicit whitelist. The old version deleted keys straight out of boxInfo,
  // which corrupted the live state after the first save.
  for (const [id, b] of Object.entries(boxInfo)) {
    boxes[id] = { txt: b.txt, html: b.html || "", js: b.js || "", css: b.css || "", q: b.q || "" }
  }
  const target = currentLayout()
  const filetime = await sendData({ endp: "saveLayout", payl: { boxes, target } })
  if (!filetime) return
  toast(target ? "Layout updated" : "Layout saved")
  await getLayouts()   // refresh the list; the server reports the new current
}

async function deleteLayout() {
  const ft = currentLayout()
  if (!ft) return
  if (!confirm(`Delete layout ${ft}?\n\nThis removes its files from disk and cannot be undone.`)) return
  if (await sendData({ endp: "deleteLayout", payl: ft })) location.reload()
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
    ...(r.layouts || []).map(l => new Option(l.filetime, l.filetime))
  )
  select.value = r.current || "null_option"
  document.getElementById("btn-delete-layout").disabled = !currentLayout()
}
