/* global L */
'use strict';


var Earthquakes = require('features/Earthquakes'),
    Moment = require('moment'),
    Xhr = require('util/Xhr');


/**
 * Adds 'feature' layers to map, summary panes
 *
 * Feature layers are event specific layers added dynamically to the map
 * and summary panes, based on the Event ID entered by user
 *
 * @param options {Object}
 *   {
 *     mapPane: {Object}, // MapPane instance
 *     statusBar: {Object}, // StatusBar instance
 *     summaryPane: {Object} // SummaryPane instance
 *   }
 */
var Features = function (options) {
  var _this,
      _initialize,

      _bounds,
      _layers,
      _mainshock,
      _mapPane,
      _statusBar,
      _summaryPane,

      _addLayer,
      _addMainshock,
      _addSummary,
      _createFeature,
      _getFeedUrl,
      _loadFeed;


  _this = {};

  _initialize = function (options) {
    options = options || {};
    _mapPane = options.mapPane;
    _statusBar = options.statusBar;
    _summaryPane = options.summaryPane;
  };

  /**
   * Add feature layer to map
   *
   * @param layer {Object}
   * @param name {String}
   */
  _addLayer = function (layer) {
    _mapPane.map.addLayer(layer);
    _mapPane.layerController.addOverlay(layer, layer.name);

    // Set bounds to contain added layer
    _bounds.extend(layer.getBounds());
    _mapPane.map.fitBounds(_bounds, {
      paddingTopLeft: L.point(0, 45), // accommodate navbar
      reset: true
    });

    // Render mainshock on top of other features
    if (_layers.mainshock) {
      _layers.mainshock.bringToFront();
    }
  };

  /**
   * Wrapper for creating mainshock feature
   *
   * @param data {Object}
   *     GeoJson data returned by Mainshock class
   */
  _addMainshock = function (data) {
    var id,
        name;

    id = 'mainshock';
    name = 'Mainshock';

    _createFeature({
      id: id,
      feature: Earthquakes,
      featureParams: {
        id: id,
        data: data,
        mainshock: _mainshock,
      },
      name: name
    });
  };

  /**
   * Add feature layer to summary pane
   *
   * @param id {String}
   * @param layer {Object}
   * @param name {String}
   */
  _addSummary = function (id, layer) {
    if (layer.summary) {
      _summaryPane.addSummary({
        id: id,
        name: layer.name,
        summary: layer.summary
      });
    }
  };

  /**
   * Create feature layer for map, summary panes
   *
   * @param opts {Object}
   *   {
   *     count: {Integer}, // number of features in layer (optional)
   *     id: {String}, // layer id (req'd)
   *     feature: {Function}, // class that creates Leaflet layer (req'd)
   *     featureParams: {Object}, // contains data prop with geojson data (req'd)
   *     name: {String} // layer name (req'd)
   *   }
   */
  _createFeature = function (opts) {
    var count,
        id,
        layer,
        name;

    count = opts.count;
    id = opts.id;
    name = opts.name;

    try {
      if (count >= 0) {
        name += ' (' + count + ')';
      }

      // Feature should be removed already, but stacked ajax requests cause issues
      _this.removeFeature(id);

      // Create Leaflet layer (and store it in _layers for access later)
      layer = opts.feature(opts.featureParams);
      layer.name = name;
      _layers[id] = layer;

      // Add feature layer to map, summary panes
      if (id === 'aftershocks' || id === 'historical') {
        // ensure aftershocks are plotted on top of historical
        if (_layers.aftershocks && _layers.historical) {
          // remove pre-existing layers so order is correct when hist. params tweaked
          _mapPane.map.removeLayer(_layers.aftershocks);
          _mapPane.map.removeLayer(_layers.historical);
          _addLayer(_layers.historical);
          _addLayer(_layers.aftershocks);
        }
      } else {
        _addLayer(layer);
      }
      _addSummary(id, layer);

      // Feature done loading; remove alert
      _statusBar.removeItem(id);
    }
    catch (error) {
      console.error(error);
      _statusBar.addError(opts.id, 'Error Loading ' + opts.name +
        '<span>' + error + '</span>');
    }
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

    baseUri = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

    pairs = ['format=geojson', 'orderby=time-asc'];
    Object.keys(params).forEach(function(key) {
      pairs.push(key + '=' + params[key]);
    });
    queryString = '?' + pairs.join('&');

    return baseUri + queryString;
  };

  /**
   * Load data feed and then call _createFeature when it's finished loading
   *
   * @param opts {Object}
   *   {
   *     id: {String},
   *     feature: {Function},
   *     name: {String},
   *     url: {String}
   *   }
   */
  _loadFeed = function (opts) {
    var msg;

    // Alert user that feature is loading
    _statusBar.addItem(opts.id, opts.name);

    Xhr.ajax({
      url: opts.url,
      success: function (data) {
        _createFeature({
          count: data.metadata.count,
          id: opts.id,
          feature: opts.feature,
          featureParams: {
            id: opts.id,
            data: data,
            mainshock: _mainshock
          },
          name: opts.name
        });
      },
      error: function (status, xhr) {
        console.error(xhr.responseText);

        msg = 'Error Loading ' + opts.name;
        if (xhr.responseText.match('limit of 20000')) {
          msg += ' <span>Modify the parameters to match fewer earthquakes' +
            ' (max 20,000)</span>';
        }
        else if (xhr.responseText.match('parameter combination')){
          msg += ' <span>All parameters are required</span>';
        }

        _statusBar.addError(opts.id, msg);
      }
    });
  };

  /**
   * Aftershocks feature layer
   *   loads feed then adds it to map, summary panes thru callbacks
   */
  _this.addAftershocks = function () {
    var id,
        name,
        params;

    id = 'aftershocks';
    name = 'Aftershocks';

    params = {
      latitude: _mainshock.geometry.coordinates[1],
      longitude: _mainshock.geometry.coordinates[0],
      maxradiuskm: document.getElementById('aftershocks-dist').value,
      minmagnitude: document.getElementById('aftershocks-minmag').value,
      starttime: Moment(_mainshock.properties.time + 1000).utc().toISOString()
        .slice(0, -5)
    };

    _loadFeed({
      id: id,
      feature: Earthquakes,
      name: name,
      url: _getFeedUrl(params)
    });
  };

  /**
   * Historical seismicity feature layer
   *   loads feed then adds it to map, summary panes thru callbacks
   */
  _this.addHistorical = function () {
    var id,
        name,
        params,
        years;

    id = 'historical';
    name = 'Historical Seismicity';
    years = document.getElementById('historical-years').value;

    params = {
      endtime: Moment(_mainshock.properties.time).utc().toISOString()
        .slice(0, -5),
      latitude: _mainshock.geometry.coordinates[1],
      longitude: _mainshock.geometry.coordinates[0],
      maxradiuskm: document.getElementById('historical-dist').value,
      minmagnitude: document.getElementById('historical-minmag').value,
      starttime: Moment(_mainshock.properties.time).utc()
        .subtract(years, 'years').toISOString().slice(0, -5)
    };

    _loadFeed({
      id: id,
      feature: Earthquakes,
      name: name,
      url: _getFeedUrl(params)
    });
  };

  /**
   * Set up environment / map and call methods for adding 'feature' layers
   *
   * @param mainshock {Object}
   *     GeoJson data returned by Mainshock class
   */
  _this.initFeatures = function (mainshock) {
    var coords;

    _bounds = new L.LatLngBounds();
    _layers = {};
    _mainshock = mainshock;

    coords = _mainshock.geometry.coordinates;

    // Center map around mainshock for now
    //   (each added feature will set map extent to contain itself)
    _mapPane.map.setView([coords[1], coords[0]], 13, { reset: true });
    _bounds = _mapPane.map.getBounds();

    // First, remove any existing event-specific features
    _this.removeFeatures();

    // Now, add event-specific features
    _addMainshock(_mainshock);
    _this.addHistorical();
    _this.addAftershocks();
  };

  /**
   * Remove feature layer from map / layer controller, summary pane
   *
   * @param id {String}
   *     feature to remove
   */
  _this.removeFeature = function (id) {
    var layer,
        summary;

    layer = _layers[id];
    summary = document.getElementById(id);

    if (layer) {
      _mapPane.map.removeLayer(layer);
      _mapPane.layerController.removeLayer(layer);
    }

    if (summary) {
      _summaryPane.removeSummary(summary);
    }
  };

  /**
   * Remove all feature layers from map / layer controller, summary pane
   */
  _this.removeFeatures = function () {
    if (_layers) {
      Object.keys(_layers).forEach(function(id) {
        _this.removeFeature(id);
      });
    }
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = Features;
