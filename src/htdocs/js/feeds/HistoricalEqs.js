'use strict';


/**
 * Historical Earthquakes Feed
 *
 * @param options {Object}
 *   {
 *     app: {Object}, // Application
 *   }
 *
 * @return _this {Object}
 *   {
 *     id: {String},
 *     name: {String),
 *     url: {String}
 *   }
 */
var HistoricalEqs = function (options) {
  var _this,
      _initialize,

      _app,

      _getFeedUrl;


  _this = {};

  _initialize = function (options) {
    options = options || {};

    _app = options.app;

    _this.id = 'historical-events';
    _this.name = 'Historical Events';
    _this.url = _getFeedUrl();
  };

  /**
   * Get URL of json feed
   *
   * @return url {String}
   */
  _getFeedUrl = function () {
    var mainshock,
        products,
        url;

    mainshock = _app.Features.getFeature('mainshock');
    products = mainshock.json.properties.products;
    url = '';

    if (products.losspager) {
      url = products.losspager[0].contents['json/historical_earthquakes.json'].url;
    }

    return url;
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = HistoricalEqs;
