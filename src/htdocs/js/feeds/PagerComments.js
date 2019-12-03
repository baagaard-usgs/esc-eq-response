'use strict';


/**
 * PAGER Comments Feed
 *
 * @param options {Object}
 *   {
 *     app: {Object}, // Application
 *   }
 */
var PagerComments = function (options) {
  var _this,
      _initialize,

      _app,

      _getFeedUrl;


  _this = {};

  _initialize = function (options) {
    options = options || {};

    _app = options.app;

    _this.id = 'pager-comments';
    _this.name = 'PAGER Comments';
    _this.url = _getFeedUrl();
  };

  /**
   * Get URL of json feed
   *
   * @return url {String}
   */
  _getFeedUrl = function () {
    var mainshockJson,
        url;

    mainshockJson = _app.Features.getFeature('mainshock').json;
    url = mainshockJson.properties.products.losspager[0].
      contents['json/comments.json'].url;

    return url;
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = PagerComments;
