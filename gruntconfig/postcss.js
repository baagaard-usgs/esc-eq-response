'use strict';

var autoprefixer = require('autoprefixer'),
    cssnano = require('cssnano'),
    calc = require('postcss-calc'),
    colorFunction = require('postcss-color-function'),
    postcssImport = require('postcss-import'),
    postcssVar = require('postcss-advanced-variables'),
    precss = require('precss');


var config = require('./config');


var postcss = {

  build: {
    options: {
      map: true,
      processors: [
        postcssImport({
          path: config.cssPath
        }),
        postcssVar(),
        precss(),
        calc(),
        colorFunction(),
        autoprefixer({'browsers': 'last 3 versions'})
      ]
    },
    cwd: config.src + '/htdocs',
    dest: config.build + '/' + config.src + '/htdocs',
    expand: true,
    ext: '.css',
    extDot: 'last',
    src: [
      '**/*.scss',
      '!**/_*.scss'
    ]
  },

  dist: {
    options: {
      processors: [
        cssnano({zindex: false})
      ]
    },
    cwd: config.build + '/' + config.src + '/htdocs',
    dest: config.dist + '/htdocs',
    expand: true,
    src: [
      '**/*.css'
    ]
  }

};

module.exports = postcss;
