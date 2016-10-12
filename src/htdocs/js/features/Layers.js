'use strict';


var EarthquakesLayer = require('features/EarthquakesLayer'),
    Moment = require('Moment'),
    Xhr = require('util/Xhr');


var Layers = function (options) {
  var _this,
      _initialize,

      _earthquake,
      _editPane,
      _features,
      _mapPane,
      _summaryPane,

      _addAftershocks,
      _addFeature,
      _addHistorical,
      _addMainshock,
      _getFeedUrl,
      _loadFeed,
      _removeFeatures;


  _this = {};

  _initialize = function (options) {
    _features = {};

    _editPane = options.editPane;
    _mapPane = options.mapPane;
    _summaryPane = options.summaryPane;
  };

  /**
   * Set params for aftershocks feature layer and then load the feed
   */
  _addAftershocks = function () {
    var mainshock,
        params;

    mainshock = _earthquake.features[0];
    params = {
      latitude: mainshock.geometry.coordinates[1],
      longitude: mainshock.geometry.coordinates[0],
      maxradiuskm: document.getElementById('ashockDistance').value,
      starttime: Moment(mainshock.properties.time + 1000).utc().toISOString().slice(0, -5)
    };

    _loadFeed({
      id: 'aftershocks',
      layerClass: EarthquakesLayer,
      name: 'Aftershocks',
      url: _getFeedUrl(params)
    });
  };

  /**
   * Create and add a feature layer to map / layer controller, summary page
   *
   * @param opts {Object}
   *   {
   *     id: {String} // layer id
   *     layerClass: {Function} // creates Leaflet layer
   *     layerOptions: {Object} // contains data prop (req'd) with geojson data
   *     name: {String} // layer name
   *   }
   */
  _addFeature = function (opts) {
    var layer;

    // Create Leaflet layer using Layer class specified in opts
    layer = opts.layerClass(opts.layerOptions);

    // Add it (and store it in _features for potential removal later)
    _mapPane.map.addLayer(layer);
    _mapPane.layerController.addOverlay(layer, opts.name);
    _features[opts.id] = layer;

    _summaryPane.addSummary({
      id: opts.id,
      name: opts.name,
      summary: layer.summary
    });
  };

  /**
   * Set params for Historical seismicity feature layer and then load the feed
   */
  _addHistorical = function () {
    var mainshock,
        params,
        years;

    mainshock = _earthquake.features[0];
    years = document.getElementById('histYears').value;
    params = {
      endtime: Moment(mainshock.properties.time).utc().toISOString().slice(0, -5),
      latitude: mainshock.geometry.coordinates[1],
      longitude: mainshock.geometry.coordinates[0],
      maxradiuskm: document.getElementById('histDistance').value,
      starttime: Moment(mainshock.properties.time).utc().subtract(years, 'years')
        .toISOString().slice(0, -5)
    };

    _loadFeed({
      id: 'historical',
      layerClass: EarthquakesLayer,
      name: 'Historical seismicity',
      url: _getFeedUrl(params)
    });
  };

  /**
   * Wrapper for earthquake (mainshock) layer
   */
  _addMainshock = function () {
    _addFeature({
      id: 'mainshock',
      layerClass: EarthquakesLayer,
      layerOptions: {
        data: _earthquake,
        mainshockTime: _earthquake.features[0].properties.time,
      },
      name: 'Mainshock'
    });
  };

  /**
   * Get the feed url for aftershock / historical seismicity layers
   *
   * @param params {Object}
   *
   * @return {String}
   */
  _getFeedUrl = function (params) {
    var baseUri,
        pairs,
        queryString;

    baseUri = 'http://earthquake.usgs.gov/fdsnws/event/1/query';

    pairs = ['format=geojson', 'orderby=time-asc'];
    Object.keys(params).forEach(function(key) {
      pairs.push(key + '=' + params[key]);
    });
    queryString = '?' + pairs.join('&');

    return baseUri + queryString;
  };

  /**
   * Load data feed and then call _addFeature when it's finished loading
   *
   * @param opts {Object}
   *   {
   *     layerClass: {Function}
   *     name: {String}
   *     url: {String}
   *   }
   */
  _loadFeed = function (opts) {
    Xhr.ajax({
      url: opts.url,
      success: function (data) {
        _addFeature({
          id: opts.id,
          layerClass: opts.layerClass,
          layerOptions: {
            data: data,
            mainshockTime: _earthquake.features[0].properties.time
          },
          name: opts.name
        });
      },
      error: function (status) {
        console.log(status);
      }
    });
  };

  /**
   * Remove all feature layers from map / layer controller, summary pane
   */
  _removeFeatures = function () {
    var layer,
        summary;

    if (_features) {
      Object.keys(_features).forEach(function(id) {
        layer = _features[id];
        summary = document.getElementById(id);

        _mapPane.map.removeLayer(layer);
        _mapPane.layerController.removeLayer(layer);

        _summaryPane.removeSummary(summary);
      });
    }
  };

  /**
   * Set up environment / map and call methods for adding 'feature' layers
   *
   * Feature layers are event specific layers added dynamically to the map
   * and summary panes, based on the eqid entered by user
   *
   * @param geojson {Object}
   *     Geojson data returned by Earthquake class
   */
  _this.initFeatureLayers = function (geojson) {
    var coords;

    _earthquake = geojson;
    coords = _earthquake.features[0].geometry.coordinates;

    _editPane.setDefaults(_earthquake);
    _mapPane.map.setView([coords[1], coords[0]], 9, true);

    // First, remove any existing event-specific layers
    _removeFeatures();

    // Now, add event-specific layers
    _addMainshock();
    _addAftershocks();
    _addHistorical();
  };

  _initialize(options);
  options = null;
  return _this;
};


module.exports = Layers;