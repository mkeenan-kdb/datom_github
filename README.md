![image](https://github.com/user-attachments/assets/932ead13-9c8c-4178-8074-29a8bab10054)

Old project, not finished, currently trying an approach with grid cells, but may not.

Each layout is a seperate webpage. They persist on disk. Each boxhas it's own css, js, html that you can configure in the browser.
Drag and position the boxes etc. 

## Running

```
q datom_server.q      # from the repo root -- PROJ_ROOT is taken from the cwd
```

Then open http://localhost:5002/datom.html

Click anywhere on the grid to drop a box. Drag it by its header, resize from the
bottom-right corner, and open the code editor from the `<>` button. Boxes are
positioned as CSS grid areas, so a saved layout restores exactly where you left it.

## Layouts

The dropdown always shows the layout currently being served, which drives what
**Save layout** does:

| dropdown | Save layout | Delete |
|---|---|---|
| `Empty layout` | creates a new layout, and you are now editing it | disabled |
| a saved layout | **rewrites that layout in place** | removes it from disk and the db |

So the loop is: build on the blank canvas, save once to create the layout, then
keep saving to update it. Pick `Empty layout` (or **New layout**) to start a fresh
one. Each layout is a full snapshot under `layouts/datom_<timestamp>/`, including
its own copy of the html/js/css, so old layouts keep working after the app changes.

`layouts/` and `db/` are generated at runtime and are gitignored.

ace and apexcharts load from a CDN, so the first run needs a network connection.

## The Q tab

Each box has four buffers: **html**, **css**, **js** and **q**. On every render the
box's q runs on the server (`.req.runQ`, plain `value`), and the result is handed
to the box's js:

```js
// your js runs with two things in scope
data   // whatever the q returned, as JSON
box    // this box's own element -- use box.querySelector(), not global ids
```

`.j.j` does the encoding, so shapes map the way you'd expect. A `by` clause is
unkeyed for you:

| q | `data` in js |
|---|---|
| `sum 1240 860 2105` | `4205` |
| `` `a`b!1 2 `` | `{a: 1, b: 2}` |
| `([]sym:`AAPL`MSFT; size:1240 860)` | `[{sym:"AAPL",size:1240}, {sym:"MSFT",size:860}]` |
| `select sum size by sym from trade` | `[{sym:"AAPL",size:400}, …]` |
| `2026.08.01+til 3` | `["2026-08-01","2026-08-02","2026-08-03"]` |
| `.z.p` | `"2026-08-06T14:48:09.914527000"` |

Multi-line q, comments and blank lines all work. If the q errors, the message is
shown in the box and the js is skipped.

### Examples

Each example lists every buffer it needs. If an example shows an `html` line,
that markup has to be in the html tab — the js looks for it. The table and chart
examples below build their own markup, so their html tab can be left empty.

**Stat tile** — q returns an atom.

```
q     sum 1240 860 2105 430
html  <div class="stat"><div class="v">-</div><div class="k">total volume</div></div>
js    box.querySelector('.v').textContent = data.toLocaleString()
```

**Table** — builds its own markup, so the html tab can stay empty and it works
for *any* q table without editing the headers.

```
q     select sym, size, px from ([]sym:`AAPL`MSFT`NVDA; size:1240 860 2105; px:214.3 402.1 121.9)
css   table{width:100%;border-collapse:collapse;font-size:13px}
      th{text-align:left;font-weight:600;opacity:.55;font-size:11px;text-transform:uppercase;padding-bottom:6px}
      td{padding:5px 0;border-top:1px solid #8882;font-variant-numeric:tabular-nums}
      td+td,th+th{text-align:right}
js    const el = box.querySelector('.datom-box-body');
      if (!data || !data.length) { el.innerHTML = '<p>no rows</p>'; }
      else {
        const cols = Object.keys(data[0]);
        const cell = v => typeof v === 'number' ? v.toLocaleString() : v;
        el.innerHTML =
          '<table><thead><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>' +
          data.map(r => '<tr>' + cols.map(c => `<td>${cell(r[c])}</td>`).join('') + '</tr>').join('') +
          '</tbody></table>';
      }
```

**Grouped aggregate → bar chart** — the `by` result arrives as an array of rows.

```
q     select sum size by sym from ([]sym:`AAPL`MSFT`AAPL`NVDA; size:100 200 300 400)
js    const el = box.querySelector('.datom-box-body');
      el.replaceChildren(Object.assign(document.createElement('div'), {style:'height:100%'}));
      new ApexCharts(el.firstChild, {
        chart:{type:'bar', height:'100%', toolbar:{show:false}, animations:{enabled:false},
               background:'transparent', foreColor:'#9aa1ad'},
        colors:['#3b6fff'], dataLabels:{enabled:false}, grid:{borderColor:'#8883'},
        series:[{name:'size', data:data.map(r => r.size)}],
        xaxis:{categories:data.map(r => r.sym)}
      }).render()
```

**Time series → area chart** — dates encode as `"YYYY-MM-DD"` strings, so they
drop straight into `categories`.

```
q     ([]d:2026.08.01+til 20; v:20+20?80)
js    const el = box.querySelector('.datom-box-body');
      el.replaceChildren(Object.assign(document.createElement('div'), {style:'height:100%'}));
      new ApexCharts(el.firstChild, {
        chart:{type:'area', height:'100%', toolbar:{show:false}, animations:{enabled:false},
               background:'transparent', foreColor:'#9aa1ad'},
        colors:['#3b6fff'], dataLabels:{enabled:false}, stroke:{curve:'smooth', width:2},
        grid:{borderColor:'#8883'},
        series:[{name:'v', data:data.map(r => r.v)}],
        xaxis:{categories:data.map(r => r.d), tickAmount:6, labels:{rotate:-45}}
      }).render()
```

**Live polling** — re-run the q from js on a timer. `sendData` is global.

```
q     `now`heapKB!(.z.p; `int$.Q.w[][`used]%1024)
html  <div class="stat"><div class="v">-</div><div class="k">server clock / heap</div></div>
js    clearInterval(box.__timer);            // else every render stacks another timer
      const paint = d => box.querySelector('.v').textContent =
        d.now.slice(11,19) + '  ' + d.heapKB + 'KB';
      paint(data);
      box.__timer = setInterval(async () =>
        paint(await sendData({endp:'runQ', payl:boxInfo[box.id].q})), 2000)
```

Point any of these at your own tables by swapping the inline table for a real
query — `select sum size by sym from trade where date=.z.d`.

### Two things to know

- **`runQ` is `value` on text from the browser** — arbitrary evaluation in your kdb
  process. That is the feature, but it means the port should stay on localhost.
- **Re-rendering re-runs your js.** Anything that registers a timer or listener
  should clear its previous one first, as the polling example does.

![datomRecording-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/049a36f6-37b5-4327-a16c-4322e7306bc3)
![datomRecording-ezgif com-video-to-gif-converter (1)](https://github.com/user-attachments/assets/b6e3d595-0d37-4387-a8cf-1ef2d67b30ef)
