const config = require('./.config.json');
const Binance = require('binance-api-node').default;
const readline = require('readline');
const cli = require('clui'), clc = require('cli-color');
const Line = cli.Line, LineBuffer = cli.LineBuffer;
const os = require('os');
const size = require('window-size');
const Gdax = require('gdax');

console.log('Starting...\n')

//Config
var baseUrl = 'https://api.binance.com';
const binance = Binance({apiKey: config.key,apiSecret: config.secret});
const btc = 'BTCUSDT', eth = 'ETHUSDT', ark = 'ARKBTC';
const binancePairs = [ark, 'BATBTC', 'FUNBTC', 'BNBUSDT', 'NEOUSDT', 'XRPUSDT'];
const gdaxPairs = ['BTC-USD', 'LTC-USD', 'ETH-USD'].reverse();
const gdaxPrices = gdaxPairs.map(ticker =>  
  new Object()[ToBinance(ticker)] = ' '
);
binancePairs.push(...gdaxPairs.map(ticker => ToBinance(ticker)));
var doBeep = true;
//Patch with status method
binance.CheckStatus = CheckStatus;

var headers = new Line()
  .padding(2)
  .column('Symbol', 10, [clc.cyan])
  .column('Binance', 15, [clc.cyan])
  .column('GDAX', 15, [clc.cyan])
  .column('Time', 20, [clc.cyan])
  .fill()
  .output();

binancePairs.forEach(() => console.log()); binancePairs.forEach(() => console.log());

const gdaxClient = new Gdax.WebsocketClient(gdaxPairs, 'wss://ws-feed.gdax.com', 
  null, {channels: ['ticker']
});

gdaxClient.on('message', data => {
  if(data.price) gdaxPrices[ToBinance(data.product_id)] = data.price;
});

gdaxClient.on('error', err => GdaxError);
gdaxClient.on('close', err => GdaxError);

binance.ws.ticker(binancePairs, ticker => {
  var offset = binancePairs.indexOf(ticker.symbol);
  readline.cursorTo(process.stdout, 0, size.height - (offset + binancePairs.length) );
  //TODO: output %/amt change 15 min
  var line = new Line()
  .padding(2)
  .column(ticker.symbol, 10)
  .column(ticker.curDayClose, 15)
  .column(gdaxPrices[ticker.symbol] || ' ', 15)
  .column(new Date().toLocaleTimeString(), 20)
  .fill()
  .output();

  //TODO: Add % difference for arbitrage
//https://www.mathsisfun.com/percentage-difference.html

  if(AlertHit(ticker)){
    if(doBeep)
      doBeep = Beep();
  }
});

setInterval(() => doBeep = true, 10000);

function AlertHit(ticker){
  return (
    ticker.symbol == btc &&
    (
      ticker.curDayClose >=9480
      || ticker.curDayClose <= 9180
    )

    // || (
    //   ticker.symbol == eth &&
    //   (
    //     ticker.curDayClose >= 789
    //     || ticker.curDayClose <= 721
    //   )
    // )

  ) 

}

function ToBinance(str) { return str.replace('-', '') + 'T';}

function GdaxError(err){
  var keys = Object.keys(gdaxPrices);
  keys.forEach(key => gdaxPrices[key] = "ERROR");

  console.log('gdax error: ', err);
  gdaxClient = new Gdax.WebsocketClient(gdaxPairs, 'wss://ws-feed.gdax.com', null, {channels: ['ticker']});
}

function TrimZeros(str){
  return parseFloat(str).toString();
}

process.on('SIGINT', () => {
  var mem = process.memoryUsage();
  readline.clearScreenDown(process.stdout);
  console.log('\n\nEnding, RAM Usage: ' + ((mem.heapUsed)/1024/1024).toFixed(2) + 'MB'); 
  process.exit(1);
});

function Beep() {process.stderr.write("\007"); return false;}

function CheckStatus(interval = 5000){
  var checkStatus = () => fetch(baseUrl + '/wapi/v3/systemStatus.html')
    .then(res => res.json())
    .then(res => {
      if(res.status == 0)
        Beep();
    })
  setInterval(checkStatus, interval);
}


//const cc = require('cryptocompare');
//const fs = require('fs');
//cc.coinList().then(data => fs.appendFileSync('coinlist.json', JSON.stringify(data)));

// client.prices().then(res => console.log(res) );