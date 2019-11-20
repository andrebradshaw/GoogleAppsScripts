function monitorEbayItem() {
  var priceThreshold = 90;
  var link = 'https://www.ebay.com/itm/Garmin-Forerunner-620-GPS-Running-Watch-Blue-Black-with-charger/113920896303?hash=item1a8636ed2f%3Ag%3Az5oAAOSwsw9doMt7&LH_BIN=1';
  var res = UrlFetchApp.fetch(link);
  var price = parseFloat(/itemprop="price"\W+style=\W+content="([\d\.]+)/.exec(res)[1]);
  if (price < priceThreshold) {
    MailApp.sendEmail('bradshaw.andre@gmail.com', 'Yo! The price on your item fell below '+priceThreshold, link);
  }else{
    Logger.log(price)
  }
}
