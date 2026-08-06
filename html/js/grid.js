// Grid geometry. The cells used to be 2100 real divs, each with its own click
// listener; they are now a CSS background plus the arithmetic below.

function cellAt(clientX, clientY) {
  const r = grid.getBoundingClientRect()
  return {
    col: clamp(Math.floor((clientX - r.left) / (r.width / COLS)) + 1, 1, COLS),
    row: clamp(Math.floor((clientY - r.top) / (r.height / ROWS)) + 1, 1, ROWS)
  }
}

function initGrid() {
  grid.addEventListener("pointerdown", e => {
    if (e.target !== grid) return   // a box was hit, not empty grid
    const { row, col } = cellAt(e.clientX, e.clientY)
    newBox(row, col)
  })
}
