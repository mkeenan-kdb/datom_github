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
  chart: { type: 'bar', height: '100%', parentHeightOffset: 0, toolbar: { show: false },
           animations: { enabled: false }, background: 'transparent', foreColor: dim },
  colors: ['#3b6fff'],
  plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
  dataLabels: { enabled: false },
  grid: { borderColor: dim + '33' },
  series: [{ name: 'shares', data: data.map(r => r.size) }],
  xaxis: { categories: data.map(r => r.sym) },
  yaxis: { labels: { formatter: v => (v / 1000).toFixed(0) + 'k' } },
  tooltip: { theme: 'dark' }
})
box.__chart.render()
