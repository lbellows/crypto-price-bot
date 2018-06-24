const config = require('./.config.json');
const Bot = require('./index')
const readline = require('readline');
console.log('Starting...\n')
//

const btc = 'BTCUSDT', eth = 'ETHUSDT', ark = 'ARKBTC';
const binancePairs = [ark, 'BATBTC', 'FUNBTC','BNBUSDT', 'NEOUSDT']; //'BNBUSDT', 'NEOUSDT'
const gdaxPairs = ['BTC-USD', 'LTC-USD', 'ETH-USD'].reverse();

binancePairs.push(...gdaxPairs.map(ticker => Bot.ToBinance(ticker)));

//Patch with status method

var bot = new Bot.CryptoPriceBot({
  binanceKey: config.binance.key,
  binanceSecret: config.binance.secret,
  binancePairs: binancePairs,
  gdaxPairs: gdaxPairs,
  beep: true,
  alertFunc: AlertHit
})

function AlertHit(ticker) {
  return (
    ticker.symbol == btc &&
    (
      ticker.curDayClose >= 8980
      || ticker.curDayClose <= 7980
    )

    || (
      ticker.symbol == ark &&
      (
        ticker.curDayClose >= 0.0004000
        || ticker.curDayClose <= 0.0003400
      )
    )
  )
}

process.on('SIGINT', () => {
  var mem = process.memoryUsage();
  readline.clearScreenDown(process.stdout);
  console.log('\n\nEnding, RAM Usage: ' + ((mem.heapUsed)/1024/1024).toFixed(2) + 'MB'); 
  process.exit(1);
});



//const cc = require('cryptocompare');
//const fs = require('fs');
//cc.coinList().then(data => fs.appendFileSync('coinlist.json', JSON.stringify(data)));

// client.prices().then(res => console.log(res) );