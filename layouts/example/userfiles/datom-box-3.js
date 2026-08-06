// A `by` result arrives as an array of rows, so 1# is still an array of one.
const top = data[0]
body.querySelector('.v').textContent = top.sym
body.querySelector('.s').textContent = top.size.toLocaleString() + ' shares'
