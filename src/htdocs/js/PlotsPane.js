/* global Plotly */
'use strict';


/**
 * Creates, adds, and removes plot from plots pane
 *
 * @param options {Object}
 *   {
 *     el: {Element}
 *   }
 */
var PlotsPane = function (options) {
  var _this,
      _initialize,

      _el,
      _features,
      _plots,

      _getLayout,
      _getRatio,
      _getTrace;


  _this = {};

  _initialize = function (options) {
    options = options || {};

    _el = options.el || document.createElement('div');
    _features = _el.querySelector('.features');
    _plots = [];

    // Make plot(s) responsive
    window.onresize = function() {
      _this.resizePlots();
    };
  };

  /**
   * Get plot layout config for plotly.js
   *
   * @param zRatio {Number}
   *
   * @return {Object}
   */
  _getLayout = function (zRatio) {
    var titlefont = {
      color: 'rgb(0,0,0)'
    };

    return {
      margin: {
        b: 20,
        l: 50,
        r: 50,
        t: 20
      },
      scene: {
        aspectratio: {
          x: 1,
          y: 1,
          z: zRatio
        },
        xaxis: {
          title: 'longitude',
          titlefont: titlefont
        },
        yaxis: {
          title: 'latitude',
          titlefont: titlefont
        },
        zaxis: {
          title: 'depth (km)',
          titlefont: titlefont
        }
      },
      showlegend: false,
    };
  };

  /**
   * Get ratio of depth values to latitude values
   *
   * @param trace {Object}
   *     plot's data trace
   *
   * @return ratio {Number}
   */
  _getRatio = function (trace) {
    var depthExtent,
        depthRange,
        latExtent,
        latRange,
        ratio;

    depthExtent = Plotly.d3.extent(trace.z);
    depthRange = depthExtent[1] - depthExtent[0];
    latExtent = Plotly.d3.extent(trace.y);
    latRange = 111 * Math.abs(latExtent[1] - latExtent[0]);
    ratio = depthRange / latRange;

    return ratio;
  };

  /**
   * Get plot trace config for plotly.js
   *
   * @param data {Object}
   *     earthquake data
   * @param name {String}
   *     name of trace
   *
   * @return {Object}
   */
  _getTrace = function  (data, name) {
    return {
      hoverinfo: 'text+x+y',
      hoverlabel: {
        bgcolor: 'rgba(255,255,255,.85)',
        bordercolor: 'rgb(153,153,153)',
        font: {
          color: 'rgb(0,0,0)'
        }
      },
      marker: {
        color: data.color, // fill
        line: {
          color: 'rgb(102,102,102)' // stroke
        },
        size: data.size,
        sizeref: 0.79, // Plotly doesn't properly honor size value; adjust it.
      },
      mode: 'markers',
      name: name,
      text: data.text,
      type: 'scatter3d',
      x: data.x,
      y: data.y,
      z: data.z
    };
  };

  // ----------------------------------------------------------
  // Public methods
  // ----------------------------------------------------------

  /**
   * Add feature (3d plot) to plot pane (plot plus <div> container)
   *   (called by Features.js)
   *
   * @param opts {Object}
   *   {
   *     data: {Object}, // plot data
   *     id: {String}, // used for css class on container elem
   *     name: {String} // feature name
   *   }
   */
  _this.add3dPlot = function (opts) {
    var cssClass,
        data,
        div,
        layout,
        plot,
        trace,
        zRatio;

    cssClass = opts.id;
    div = document.createElement('div');
    div.classList.add('content', 'feature', cssClass);
    div.innerHTML = '<h2>' + opts.name + '</h2><div class="plot"></div>';

    _features.appendChild(div);

    plot = div.querySelector('.plot');
    _plots.push(plot); // store plot in closure

    // Get trace(s) for plot and store in data (mainshock is in a separate trace)
    data = [];
    Object.keys(opts.data).forEach(function(key) {
      trace = _getTrace(opts.data[key], key);
      data.push(trace);
    });

    zRatio = _getRatio(opts.data[opts.id]);
    layout = _getLayout(zRatio);

    Plotly.plot(plot, data, layout, {
      showLink: false
    });
  };

  /**
   * Remove feature from plot pane (including container)
   *   (called by Features.js)
   *
   * @param el {Element}
   *     Element to remove
   */
  _this.removePlot = function (el) {
    if (_el.contains(el)) {
      el.parentNode.removeChild(el);
    }
  };

  /**
   * Resize plots: Sets initial size and adds responsive / fluid sizing
   */
  _this.resizePlots = function () {
    _plots.forEach(function(plot) {
      Plotly.Plots.resize(plot);
    });
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = PlotsPane;
