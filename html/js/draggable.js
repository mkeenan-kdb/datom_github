// Drag + resize, both as grid-area edits. Pointer events give touch/pen for
// free, and setPointerCapture replaces the old document.onmousemove juggling.

function startDrag(e, box, mode) {
  if (e.button !== 0) return
  // Buttons live inside the drag handle. Capturing the pointer here retargets
  // the following pointerup/click to the handle, so the button's own click
  // never fires -- leave the press alone and let it through.
  if (e.target.closest("button")) return
  e.preventDefault()
  e.stopPropagation()   // otherwise the grid reads it as "make a new box here"

  const start = getArea(box)
  const origin = cellAt(e.clientX, e.clientY)
  const handle = e.currentTarget
  handle.setPointerCapture(e.pointerId)
  box.classList.add("dragging")

  function onMove(ev) {
    const now = cellAt(ev.clientX, ev.clientY)
    const dr = now.row - origin.row
    const dc = now.col - origin.col
    if (mode === "move") {
      setArea(box,
        clamp(start.row + dr, 1, ROWS + 1 - start.h),
        clamp(start.col + dc, 1, COLS + 1 - start.w),
        start.w, start.h)
    } else {
      setArea(box, start.row, start.col,
        clamp(start.w + dc, 1, COLS + 1 - start.col),
        clamp(start.h + dr, 1, ROWS + 1 - start.row))
    }
  }

  function onUp() {
    handle.removeEventListener("pointermove", onMove)
    handle.removeEventListener("pointerup", onUp)
    handle.removeEventListener("pointercancel", onUp)
    box.classList.remove("dragging")
    updateBoxState()
  }

  handle.addEventListener("pointermove", onMove)
  handle.addEventListener("pointerup", onUp)
  handle.addEventListener("pointercancel", onUp)
}
