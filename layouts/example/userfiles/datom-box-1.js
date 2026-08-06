// `data` is the q tab's result as JSON -- here a dict, so {shares, trades}.
body.querySelector('.v').textContent = data.shares.toLocaleString()
body.querySelector('.s').textContent = data.trades.toLocaleString() + ' trades'
