/* global L */
'use strict';


var Moment = require('moment'),
    Util = require('util/Util');

require('leaflet.label');


var _COLORS,
    _DEFAULTS,
    _MARKER_DEFAULTS;

_COLORS = {
  historical: '#ccd',
  mainshock: '#00f',
  pasthour: '#f00',
  pastday: '#f90',
  pastweek: '#ff0',
  older: '#ffd'
};
_MARKER_DEFAULTS = {
  weight: 1,
  opacity: 0.5,
  fillOpacity: 0.7,
  color: '#333'
};
_DEFAULTS = {
  data: {},
  markerOptions: _MARKER_DEFAULTS
};


/**
 * Factory for Earthquakes overlay
 *
 * @param options {Object}
 *     {
 *       data: {String} Geojson data
 *       markerOptions: {Object} L.Path options
 *     }
 *
 * @return {L.FeatureGroup}
 */
var EarthquakesLayer = function (options) {
  var _this,
      _initialize,

      _mainshockTime,
      _markerOptions,
      _pastDay,
      _pastHour,
      _pastWeek,
      _summary,

      _getAge,
      _getSummary,
      _onEachFeature,
      _pointToLayer;


  _initialize = function (options) {
    options = Util.extend({}, _DEFAULTS, options);
    _markerOptions = Util.extend({}, _MARKER_DEFAULTS, options.markerOptions);

    _mainshockTime = options.mainshockTime;
    _pastDay = Moment.utc().subtract(1, 'days');
    _pastHour = Moment.utc().subtract(1, 'hours');
    _pastWeek = Moment.utc().subtract(1, 'weeks');
    _summary = '';

    _this = L.geoJson(options.data, {
      onEachFeature: _onEachFeature,
      pointToLayer: _pointToLayer
    });

    // Attach text summary to layer
    _this.summary = _getSummary();
  };


  /**
   * Get 'age' of earthquake (pasthour, pastday, etc)
   *
   * @param timestamp {Int} milliseconds since 1970
   *
   * @return age {String}
   */
  _getAge = function (timestamp) {
    var age,
        eqtime;

    eqtime = Moment.utc(timestamp, 'x'); // unix ms timestamp
    if (timestamp < _mainshockTime) {
      age = 'historical';
    } else if (eqtime.isSameOrAfter(_pastHour)) {
      age = 'pastweek';
    } else if (eqtime.isSameOrAfter(_pastDay)) {
      age = 'pastday';
    } else if (eqtime.isSameOrAfter(_pastWeek)) {
      age = 'pasthour';
    } else if (timestamp === _mainshockTime) {
      age = 'mainshock';
    } else {
      age = 'older';
    }

    return age;
  };

  /**
   * Get summary html for summary pane
   *
   * @return summary {String}
   */
  _getSummary = function () {
    var summary;

    summary = '<table>' + _summary + '</table>';

    return summary;
  };

  /**
   * Leaflet GeoJSON option: called on each created feature layer. Useful for
   * attaching events and popups to features.
   *
   * @param feature {Object}
   * @param layer (L.Layer)
   */
  _onEachFeature = function (feature, layer) {
    var data,
        label,
        labelTemplate,
        localTime,
        momentObj,
        popup,
        popupTemplate,
        props,
        summaryTemplate,
        utcTime;

    props = feature.properties;

    momentObj = Moment.utc(props.time, 'x');
    utcTime = momentObj.format('MMM D, YYYY HH:mm:ss') + ' UTC';

    // Calculate local time if tz prop included in feed; otherwise use UTC
    if (props.tz) {
      localTime = momentObj.utcOffset(props.tz).format('MMM D, YYYY h:mm:ss A');
    } else {
      localTime = utcTime;
    }

    data = {
      depth: feature.geometry.coordinates[2],
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
      localTime: localTime,
      mag: Math.round(props.mag * 10) / 10,
      magType: props.magType,
      place: props.place,
      status: props.status,
      utcTime: utcTime,
      url: props.url
    };

    // Create label
    labelTemplate = 'M{mag} - {utcTime}';
    label = L.Util.template(labelTemplate, data);

    // Create popup html
    popupTemplate = '<div class="popup eq">' +
        '<h2><a href="{url}" target="_blank">M {mag} - {place}</a></h2>' +
        '<dl>' +
          '<dt>Time</dt><dd><time>{utcTime}</time></dd>' +
          '<dt>Location (depth)</dt><dd>{lat}, {lng} ({depth} km)</dd>' +
          '<dt>Magnitude ({magType})</dt><dd>{mag}</dd>' +
          '<dt>Status</dt><dd>{status}</dd>' +
        '</dl>' +
      '</div>';
    popup = L.Util.template(popupTemplate, data);

    // Bind popup and label to marker
    layer.bindPopup(popup, {
      autoPanPadding: L.point(50, 50),
      maxWidth: '265'
    }).bindLabel(label);

    // Create summary html
    summaryTemplate = '<tr>' +
        '<th>Mag</th>' +
        '<th>Time <span>(local unless UTC specified)</span></th>' +
        '<th>Cooordinates</th>' +
        '<th>Depth</th>' +
      '</tr><tr>' +
        '<td>{magType} {mag}</td>' +
        '<td>{localTime}</td>' +
        '<td>{lat}, {lng}</td>' +
        '<td>{depth} km</td>' +
      '</tr>';
    _summary += L.Util.template(summaryTemplate, data);
  };

  /**
   * Leaflet GeoJSON option: used for creating layers for GeoJSON points
   *
   * @param feature {Object}
   * @param latlng {L.LatLng}
   *
   * @return marker {L.CircleMarker}
   */
  _pointToLayer = function (feature, latlng) {
    var age,
        fillColor,
        radius;

    age = _getAge(feature.properties.time);
    fillColor = _COLORS[age];
    radius = 3 * parseInt(Math.pow(10, (0.11 * feature.properties.mag)), 10);

    _markerOptions.fillColor = fillColor;
    _markerOptions.radius = radius;

    return L.circleMarker(latlng, _markerOptions);
  };

  _initialize(options);
  options = null;
  return _this;
};


L.earthquakesLayer = EarthquakesLayer;

module.exports = EarthquakesLayer;