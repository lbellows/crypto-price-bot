const Binance = require('binance-api-node').default;
const readline = require('readline');
const cli = require('clui'), clc = require('cli-color');
const Line = cli.Line, LineBuffer = cli.LineBuffer;
const os = require('os');
const size = require('window-size');
const Gdax = require('gdax');

class CryptoPriceBot {
  constructor(config) {
    const binance = Binance({ apiKey: config.binanceKey, apiSecret: config.binanceSecret });
    binance.CheckStatus = CheckStatus;
    var headers = new Line()
      .padding(2)
      .column('Symbol', 10, [clc.cyan])
      .column('Binance', 15, [clc.cyan])
      .column('GDAX', 15, [clc.cyan])
      .column('Time', 20, [clc.cyan])
      .fill()
      .output();

    var binancePairs = config.binancePairs;
    var gdaxPairs = config.gdaxPairs;
    var doBeep = true;

    binancePairs.forEach(() => console.log()); binancePairs.forEach(() => console.log());
    const gdaxPrices = gdaxPairs.map(ticker =>
      new Object()[ToBinance(ticker)] = ' '
    );
    const gdaxClient = new Gdax.WebsocketClient(gdaxPairs, 'wss://ws-feed.gdax.com',
      null, {
        channels: ['ticker']
      });

    gdaxClient.on('message', data => {
      if (data.price) gdaxPrices[ToBinance(data.product_id)] = data.price;
    });

    gdaxClient.on('error', err => GdaxError);
    gdaxClient.on('close', err => GdaxError);

    //TODO: track coins i own and beep when something happens/send email, mailgun/aws
    binance.ws.ticker(binancePairs, ticker => {
      var offset = binancePairs.indexOf(ticker.symbol);
      readline.cursorTo(process.stdout, 0, size.height - (offset + binancePairs.length));
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

      if (config.alertFunc(ticker)) {
        if (doBeep && config.beep)
          doBeep = Beep();
      }
    });

    //resets beep timeout
    if (config.beep)
      setInterval(() => doBeep = true, 10000);

    //end constructor
  }

  //class
}
function ToBinance(str) { return str.replace('-', '') + 'T'; }
function TrimZeros(str) { return parseFloat(str).toString(); }

module.exports = {
  CryptoPriceBot,
  ToBinance,
  TrimZeros
}

//privates
function CheckStatus(interval = 5000) {
  var checkStatus = () => fetch('https://api.binance.com/wapi/v3/systemStatus.html')
    .then(res => res.json())
    .then(res => {
      if (res.status == 0)
        Beep();
    })
  setInterval(checkStatus, interval);
}

function Beep() { process.stderr.write("\007"); return false; }



function GdaxError(err) {
  var keys = Object.keys(gdaxPrices);
  keys.forEach(key => gdaxPrices[key] = "ERROR");

  console.log('gdax error: ', err);
  gdaxClient = new Gdax.WebsocketClient(gdaxPairs, 'wss://ws-feed.gdax.com', null, { channels: ['ticker'] });
}