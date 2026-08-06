body.querySelector('.v').textContent = '$' + (data.notional / 1e6).toFixed(1) + 'M'
body.querySelector('.s').textContent = 'avg price $' + data.avgpx.toFixed(2)
