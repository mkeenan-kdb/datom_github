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

box.__chart = new ApexCharts(host, {
  chart: { type: 'donut', height: '100%', parentHeightOffset: 0, animations: { enabled: false },
           background: 'transparent', foreColor: dim },
  colors: ['#3b6fff', '#e5484d'],
  labels: data.map(r => r.side),
  series: data.map(r => r.size),
  // The name goes on the slice: Apex draws a bottom legend outside the
  // height it was given, so in a box this size it gets clipped off.
  legend: { show: false },
  dataLabels: { formatter: (v, o) => [o.w.config.labels[o.seriesIndex], v.toFixed(0) + '%'] },
  stroke: { width: 0 },
  plotOptions: { pie: { donut: { size: '62%' } } },
  tooltip: { theme: 'dark', y: { formatter: v => v.toLocaleString() + ' shares' } }
})
box.__chart.render()
