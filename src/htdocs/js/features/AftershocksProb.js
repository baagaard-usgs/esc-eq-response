'use strict';


var Util = require('hazdev-webutils/src/util/Util');


var _DEFAULTS;

// Default model parameters
_DEFAULTS = {
  aa: -1.76,
  bb: 0.90,
  pp: 1.07,
  cc: 0.05,
  conf: 0.95
};

var AftershocksProb = function (options) {
  var _this,
      _initialize,

      _modelParams,

      _calcNum,
      _calcPoisson,
      _calcProb,
      _calcRange;

  _this = {};

  _initialize = function (options) {
    options = Util.extend({}, _DEFAULTS, options);

    // If p-value is equal to 1.0, replace with 1.00001
    if (Math.abs(options.pp - 1.0) <  0.00001) {
      options.pp = 1.00001;
    }

    _modelParams = options;
  };

  /**
   * Calculate expected number of events
   *
   * @param options {Object}
   * @param options.aa, options.bb, options.pp, options.cc {Number}
   *     Generic aftershock model parameters
   * @param options.dm1 {Number}
   *     Aftershock lower mag - mainshock mag
   * @param options.dm2 {Number}
   *     Aftershock upper mag - mainshock mag
   * @param options.t1 {Number}
   *     Starting time of interval (after mainshock)
   * @param options.t2 {Number}
   *     Ending time of interval (after mainshock)
   *
   * @return {Number}
   */
  _calcNum = function (options) {
    var part1,
        part2,
        qq;

    qq = 1 - options.pp;
    part1 = Math.pow(10, (options.aa - options.bb * options.dm1)) -
      Math.pow(10, (options.aa - options.bb * options.dm2));

    if (qq === 0) {
      part2 = (Math.log(options.t2 + options.cc) -
        Math.log(options.t1 + options.cc)) / qq;
    } else {
      part2 = (Math.pow((options.t2 + options.cc), qq) -
        Math.pow((options.t1 + options.cc), qq)) / qq;
    }

    return part1 * part2;
  };

  /**
   * Calculate the probability of observing 'k' events when 'a' are expected
   *
   * @param a {Number}
   *     Expected number of events in a Poisson process
   * @param k {Number}
   *     Number of events observed
   *
   * @return {Number}
   */
  _calcPoisson = function (a, k) {
    var i,
        x;

    x = 1;
    for (i = 1; i <= k; i ++) {
      x *= a / i;
    }

    return x * Math.exp(-a);
  };

  /**
   * Calculate probability of specified event(s) occurring in the specified time periods
   *
   * @param number {Number}
   *     Expected number of events
   *
   * @return prob {Number}
   */
  _calcProb = function (number) {
    var prob = 1 - Math.exp(-number);

    return prob;
  };

  /**
   * Calculate confidence range for 'a', at 'conf' confidence level
   *
   * @param a {Number}
   *     Expected number of events in a Poisson process
   * @param conf {Number}
   *     Confidence level desired
   *
   * @return {Array}
   */
  _calcRange = function (a, conf) {
    var f,
        lower,
        p,
        q,
        sigma,
        sum,
        upper;

    if (a > 100) { // use asymptotic approximation (Normal distribution)
      f = 2; // ~95% confidence
      sigma = Math.sqrt(a);
      lower = a - f * sigma;
      upper = a + f * sigma;
    } else { // accumulate probabilities until sum reaches conf
      lower = a;
      upper = lower + 1;
      p = _calcPoisson(a, lower);
      q = _calcPoisson(a, upper);
      sum = 0;

      while (sum < conf) {
        if (lower >= 0 && p > q) {
          sum += p;
          p = _calcPoisson(a, --lower);
        } else {
          sum += q;
          q = _calcPoisson(a, ++upper);
        }
      }

      lower++;
      upper--;
    }

    return [
      Number.parseInt(lower, 10),
      Number.parseInt(upper, 10)
    ];
  };

  // ----------------------------------------------------------
  // Public methods
  // ----------------------------------------------------------

  /**
   * Calculate aftershock probability
   *
   * @param options {Object}
   * @param options.mainshock {Number} (required)
   *     Mainshock mag
   * @param options.aftershock {Number}
   *     Aftershock min mag
   * @param options.duration {Number}
   *     Duration of interval (days)
   * @param options.start {Number}
   *     Start of interval (days after mainshock)
   *
   * @return {Object}
   */
  _this.calculate = function (options) {
    var defaults,
        num,
        prob,
        range;

    if (!options.mainshock) {
      throw new Error ('Mainshock magnitude is required to calculate aftershock probability');
    }

    defaults = {
      aftershock: options.mainshock - 1,
      duration: 7,
      start: 0.01
    };
    options = Util.extend({}, defaults, options);

    // Calculate expected number of M>=3 aftershocks
    num = _calcNum({
      aa: _modelParams.aa,
      bb: _modelParams.bb,
      pp: _modelParams.pp,
      cc: _modelParams.cc,
      dm1: options.aftershock - options.mainshock,
      dm2: 9.0,
      t1: options.start,
      t2: options.start + options.duration
    });

    // Calculate probability of 1 or more aftershocks in specified time period and magnitude range
    prob = _calcProb(num);

    // Calculate range for expected number
    range = _calcRange(num, _modelParams.conf);

    return {
      aftershock: options.aftershock,
      conf: _modelParams.conf,
      duration: options.duration,
      mainshock: options.mainshock,
      number: num,
      probability: prob,
      max: range[1],
      min: range[0],
      start: options.start
    };
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = AftershocksProb;