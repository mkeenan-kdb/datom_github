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

async function sendData(data) {
  console.log("→", data.endp, data.payl)
  const response = await fetch(API, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-type": "application/json; charset=UTF-8" }
  })
  if (!response.ok) { toast("HTTP " + response.status); return null }
  const resp = JSON.parse(await response.text())
  if (resp.err) { toast("Server error: " + resp.err); return null }
  return resp.resp
}

async function saveLayout() {
  updateBoxState()
  const payl = {}
  // Explicit whitelist. The old version deleted keys straight out of boxInfo,
  // which corrupted the live state after the first save.
  for (const [id, b] of Object.entries(boxInfo)) {
    payl[id] = { txt: b.txt, html: b.html || "", js: b.js || "", css: b.css || "", q: b.q || "" }
  }
  const filetime = await sendData({ endp: "saveLayout", payl })
  if (!filetime) return
  toast("Layout saved")
  // A save creates a new snapshot, so the dropdown is stale until we refetch.
  await getLayouts()
  document.getElementById("file-select").value = filetime
}

async function newLayout() {
  if (await sendData({ endp: "newLayout", payl: "" })) location.reload()
}

async function changeLayout(e) {
  if (e.target.value === "null_option") return
  if (await sendData({ endp: "changeLayout", payl: e.target.value })) location.reload()
}

async function getLayouts() {
  parseLayouts(await sendData({ endp: "getLayouts", payl: {} }) || [])
}

function parseLayouts(layouts) {
  document.getElementById("file-select").replaceChildren(
    new Option("Empty layout", "null_option"),
    ...layouts.map(l => new Option(l.filetime, l.filetime))
  )
}
