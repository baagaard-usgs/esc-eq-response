'use strict';


var AftershocksProb = require('features/AftershocksProb'),
    Earthquakes = require('features/Earthquakes');


/**
 * Creates Aftershocks feature
 *
 * @param options {Object}
 *   {
 *     json: {Object}, // geojson data for feature
 *     mainshockJson: {Object}, // mainshock geojson: magnitude, time, etc.
 *     name: {String} // layer name
 *   }
 */
var Aftershocks = function (options) {
  var _this,
      _initialize,

      _mag,
      _magThreshold,

      _AftershocksProb,
      _Earthquakes,

      _getName,
      _getProbabilities;


  _this = {};

  _initialize = function (options) {
    // Unique id; note that value is "baked into" app's js/css
    var id = 'aftershocks';

    options = options || {};

    _AftershocksProb = AftershocksProb();
    _Earthquakes = Earthquakes({
      id: id,
      json: options.json,
      mainshockJson: options.mainshockJson
    });

    _mag = options.mainshockJson.properties.mag;
    _magThreshold = Math.floor(_mag - 2.5);

    _this.displayLayer = true;
    _this.id = id;
    _this.name = _getName();
    _this.zoomToLayer = true;
  };

  /**
   * Get layer name of feature (adds number of features to name)
   *
   * @return {String}
   */
  _getName = function () {
    return options.name + ' (' + options.json.metadata.count + ')';
  };

  _getProbabilities = function () {
    var html,
        prob;

    html = '<h3>Probabilities</h3>';
    prob = _AftershocksProb.calculate({
      mainshock: _mag,
      start: parseFloat(_Earthquakes.getDuration())
    });

    console.log(prob);

    return html;
  };

  // ----------------------------------------------------------
  // Public methods
  // ----------------------------------------------------------

  /**
   * Get map layer of feature
   *
   * @return {L.FeatureGroup}
   */
  _this.getMapLayer = function () {
    return _Earthquakes.getMapLayer();
  };

  /**
   * Get feature's data for plots pane
   *
   * @return {Object}
   */
  _this.getPlotData = function () {
    return {
      detailsHtml: _Earthquakes.getDetails(),
      plotdata: _Earthquakes.getPlotData()
    };
  };

  /**
   * Get feature's data for summary pane
   *
   * @return {Object}
   */
  _this.getSummaryData = function () {
    return {
      bins: _Earthquakes.getBinnedData(),
      detailsHtml: _Earthquakes.getDetails(),
      lastId: _Earthquakes.getLastId(),
      list: _Earthquakes.getList(),
      magThreshold: _magThreshold,
      probabilities: _getProbabilities()
    };
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = Aftershocks;
