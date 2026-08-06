// Apex needs concrete colours, so read the page's own so the chart follows
// the light/dark theme instead of fighting it.
const dim = getComputedStyle(document.body).getPropertyValue('--fg-dim').trim()
// The html tab put a title above us; give the chart what is left.
const host = document.createElement('div')
host.style.height = 'calc(100% - 24px)'
body.append(host)
// renderBox rewrites body from the html tab on every render, so the old chart
// node is already gone -- destroy() releases the listeners it left behind.
box.__chart?.destroy()

// times encode as "09:30:00.000", so slice them down to HH:MM for the axis
box.__chart = new ApexCharts(host, {
  chart: { type: 'area', height: '100%', parentHeightOffset: 0, toolbar: { show: false },
           animations: { enabled: false }, background: 'transparent', foreColor: dim },
  colors: ['#3b6fff'],
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  fill: { type: 'gradient', gradient: { opacityFrom: .35, opacityTo: 0 } },
  grid: { borderColor: dim + '33' },
  series: [{ name: 'notional', data: data.map(r => Math.round(r.notional / 1e6)) }],
  xaxis: { categories: data.map(r => r.time.slice(0, 5)), tickAmount: 8 },
  yaxis: { labels: { formatter: v => '$' + v + 'M' } },
  tooltip: { theme: 'dark' }
})
box.__chart.render()
