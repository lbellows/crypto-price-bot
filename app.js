const config = require('./.config.json');
const Binance = require('binance-api-node').default;
const readline = require('readline');
const cli = require('clui'),
    clc = require('cli-color');
const os = require('os');
const Line          = cli.Line,
    LineBuffer    = cli.LineBuffer;
const size = require('window-size');
const Gdax = require('gdax');

console.log('Starting...\n')

var baseUrl = 'https://api.binance.com';
const client = Binance({
    apiKey: config.key,
    apiSecret: config.secret
});

const btc = 'BTCUSDT';
const ark = 'ARKBTC';
const binancePairs = [ark, 'BATBTC', 'FUNBTC', 'BNBUSDT'];
const gdaxPairs = ['BTC-USD', 'LTC-USD', 'ETH-USD'].reverse();
//map gdax => binance
binancePairs.push(...gdaxPairs.map(ticker => ticker.replace('-', '') + 'T'));
var gdaxPrice = {
  'BTCUSDT': ' ',
  'LTCUSDT': ' ',
  'ETHUSDT': ' '
}

var doBeep = true;

var headers = new Line()
  .padding(2)
  .column('Symbol', 10, [clc.cyan])
  .column('Binance', 15, [clc.cyan])
  .column('GDAX', 15, [clc.cyan])
  .column('Time', 20, [clc.cyan])
  .fill()
  .output();

binancePairs.forEach(() => console.log());
binancePairs.forEach(() => console.log());


const websocket = new Gdax.WebsocketClient(gdaxPairs, 'wss://ws-feed.gdax.com', null, {channels: ['ticker']});

websocket.on('message', data => {
  if(data.price){
    //console.log(data)
    gdaxPrice[data.product_id.replace('-', '') + 'T'] = data.price;
  }
});

websocket.on('error', err => {
  var keys = Object.keys(gdaxPrice);
  keys.forEach(key => gdaxPrice[key] = "ERROR");

});

setInterval(() => doBeep = true, 10000);

client.ws.ticker(binancePairs, ticker => {

  var offset = binancePairs.indexOf(ticker.symbol);
  readline.cursorTo(process.stdout, 0, size.height - (offset + binancePairs.length) );

  //TODO: output %/amt change 15 min
  var line = new Line()
  .padding(2)
  .column(ticker.symbol, 10)
  .column(ticker.curDayClose, 15)
  .column(gdaxPrice[ticker.symbol] || ' ', 15)
  .column(new Date().toLocaleTimeString(), 20)
  .fill()
  .output();

  if(AlertHit(ticker)){
    if(doBeep){
      Beep();
      doBeep = false;
    }
  }
});

function TrimZeros(str){
  return parseFloat(str).toString();
}

process.on('SIGINT', () => {
  var mem = process.memoryUsage();
  readline.clearScreenDown(process.stdout);
  console.log('\n\nEnding, RAM Usage: ' + ((mem.heapUsed)/1024/1024).toFixed(2) + 'MB'); 
  process.exit(1);
});

function AlertHit(ticker){
  return (
    ticker.symbol == btc &&
    (
      ticker.curDayClose >= 9390
      || ticker.curDayClose <= 8590
    )
  ) 
  // ||
  // (
  //   ticker.symbol == ark && (ticker.curDayClose <= 0.0003200 || ticker.curDayClose >= 3900)
  // )
}

function CheckStatus(){
  var checkStatus = () => fetch(baseUrl + '/wapi/v3/systemStatus.html')
    .then(res => res.json())
    .then(res => {
      console.log(res)
      if(res.status == 0)
        Beep();
    })
  
  setInterval(checkStatus, 5000);
}

function Beep() {process.stderr.write("\007"); }

// client.prices().then(res => console.log(res) );