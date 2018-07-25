'use strict';


var config = require('./config');


var uglify = {

  options: {
    mangle: true,
    compress: {},
    report: 'gzip'
  },

  dist: {
    files: [{
      expand: true,
      cwd: config.build + '/' + config.src,
      src: [
        '**/*.js',
        '!**/bundle.js',
        '!**/leaflet-src.esm.js' // uglify fails and this file is not needed
      ],
      dest: config.dist
    }]
  }

};


module.exports = uglify;
