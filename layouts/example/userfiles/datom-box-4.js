// Re-rendering re-runs this js, so clear the timer the previous run left
// behind -- otherwise every edit stacks another poller on this box.
clearInterval(box.__timer)

const paint = d => {
  body.querySelector('.v').textContent = d.now.slice(11, 19)
  body.querySelector('.s').textContent = d.heapKB.toLocaleString() + ' KB heap'
}
paint(data)

// sendData is global, and boxInfo[box.id].q is this box's own q tab: the
// whole live-updating pattern is one setInterval re-running it.
box.__timer = setInterval(async () => {
  const d = await sendData({ endp: 'runQ', payl: boxInfo[box.id].q })
  if (d) paint(d)
}, 1000)
