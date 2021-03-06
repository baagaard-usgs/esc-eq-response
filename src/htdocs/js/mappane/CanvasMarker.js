/* global L */
'use strict';


/**
 * This class extends L.Marker by adding an existing canvas element in the page
 *   to the Leaflet Marker whenever it is turned on by user in the layer control
 */
L.CanvasMarker = L.Marker.extend({
  initialize: function (latlng, options) {
    L.Util.setOptions(this, options);
    L.Marker.prototype.initialize.call(this, latlng, this.options);
  },

  onAdd: function(map) {
    var canvas,
        className,
        marker;

    // Call L.Marker's onAdd method first
    L.Marker.prototype.onAdd.call(this, map);

    // Move canvas element from below map to marker
    // (it's added to the DOM when it's created and the marker doesn't exist yet)
    className = this.options.icon.options.className;
    canvas = document.querySelector('#mapPane canvas.' + className);
    marker = document.querySelector('.leaflet-map-pane .' + className);

    marker.appendChild(canvas);
  },

  onRemove: function(map) {
    var canvas,
        className;

    className = this.options.icon.options.className;
    canvas = document.querySelector('.' + className + ' canvas');

    // Move canvas element back to below map
    document.querySelector('#mapPane').appendChild(canvas);

    // Call L.Marker's onRemove method last
    L.Marker.prototype.onRemove.call(this, map);
  }
});

L.canvasMarker = function(latlng, options) {
  return new L.CanvasMarker(latlng, options);
};

module.exports = L.CanvasMarker;
