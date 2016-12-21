'use strict';


var Moment = require('moment'),
    Tablesort = require('tablesort');


/**
 * Adds / removes summary info from summary pane
 *
 * @param options {Object}
 *   {
 *     el: {Element}
 *   }
 */
var SummaryPane = function (options) {
  var _this,
      _initialize,

      _el,
      _features,

      _addTimestamp,
      _initTableSort,
      _updateTimestamp;


  _this = {};

  _initialize = function (options) {
    options = options || {};
    _el = options.el || document.createElement('div');

    _features = _el.querySelector('.features');

    _addTimestamp();
  };

  /**
   * Add timestamp to summary pane
   */
  _addTimestamp = function () {
    var time;

    time = document.createElement('time');
    time.classList.add('updated');
    _el.insertBefore(time, _features);
  };

  /*
   * Make table sortable
   *
   * @param id {String}
   *     #id value of container elem
   */
  _initTableSort = function (id) {
    var table,
        cleanNumber,
        compareNumber;

    // Add number sorting plugin to Tablesort
    // https://gist.github.com/tristen/e79963856608bf54e046
    cleanNumber = function (i) {
      return i.replace(/[^\-?0-9.]/g, '');
    };
    compareNumber = function (a, b) {
      a = parseFloat(a);
      b = parseFloat(b);

      a = isNaN(a) ? 0 : a;
      b = isNaN(b) ? 0 : b;

      return a - b;
    };
    Tablesort.extend('number', function(item) {
      return item.match(/^-?[£\x24Û¢´€]?\d+\s*([,\.]\d{0,2})/) || // Prefixed currency
        item.match(/^-?\d+\s*([,\.]\d{0,2})?[£\x24Û¢´€]/) || // Suffixed currency
        item.match(/^-?(\d)*-?([,\.]){0,1}-?(\d)+([E,e][\-+][\d]+)?%?$/); // Number
      }, function(a, b) {
        a = cleanNumber(a);
        b = cleanNumber(b);
        return compareNumber(b, a);
    });

    table = _el.querySelector('#' + id + ' .sortable');
    if (table) {
      new Tablesort(table);
    }
  };

  /**
   * Update timestamp
   */
  _updateTimestamp = function () {
    var time,
        timestamp;

    time = _el.querySelector('time');
    timestamp = Moment().format('ddd MMM D, YYYY [at] h:mm:ss A');

    time.innerHTML = timestamp;
  };

  /**
   * Add summary text to summary pane (text plus <div> container)
   *
   * @param opts {Object}
   *   {
   *     id: {String}, // id for container elem
   *     name: {String}, // feature name
   *     summary: {Html} // summary text
   *   }
   */
  _this.addSummary = function (opts) {
    var div;

    div = document.createElement('div');
    div.classList.add('content', 'feature');
    div.setAttribute('id', opts.id);
    div.innerHTML = '<h2>' + opts.name + '</h2>' + opts.summary;

    _features.appendChild(div);

    if (opts.id === 'aftershocks') {
      div.classList.add('darker');
    } else {
      div.classList.add('lighter');
    }

    _updateTimestamp();
    _initTableSort(opts.id);
  };

  /**
   * Remove summary text from summary pane (text plus <div> container)
   *
   * @param el {Element}
   *     Element to remove
   */
  _this.removeSummary = function (el) {
    if (_el.contains(el)) {
      el.parentNode.removeChild(el);
    }
  };

  /**
   * Reset timestamp
   */
  _this.resetTimeStamp = function () {
    var time;

    time = _el.querySelector('time');
    time.innerHTML = '';
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = SummaryPane;
