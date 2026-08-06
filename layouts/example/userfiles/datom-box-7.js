// Builds its own markup from whatever columns the q returned, so this box
// works for any table without editing the headers.
if (!data || !data.length) return body.insertAdjacentHTML('beforeend', '<p>no rows</p>')

const cols = Object.keys(data[0])
// big numbers read better whole, small ones need their pence
const fmt = v => typeof v !== 'number' ? v
  : v.toLocaleString(undefined, { maximumFractionDigits: v >= 1000 ? 0 : 2 })

body.insertAdjacentHTML('beforeend',
  '<table class="dtable"><thead><tr>' +
  cols.map(c => `<th>${c}</th>`).join('') +
  '</tr></thead><tbody>' +
  data.map(r => `<tr class="${r.side}">` +
    cols.map(c => `<td>${fmt(r[c])}</td>`).join('') + '</tr>').join('') +
  '</tbody></table>')
