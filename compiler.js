// Copyright 2011 Google Inc. All Rights Reserved.
//
// Use of this source code is governed by a BSD-type license.
// See the COPYING file for details.

/**
 * A command-line precompiler for an ExCSS file.
 *
 * Author: Benjamin Kalman <kalman@chromium.org>
 */

var exCss = require('./excss_module.js');
var fs = require('fs');
var opts = require('./opts.js');

// Abstraction of an ExCSS file.
function ExCssFile(name) {
  this.name = name;
  var fileContents = fs.readFileSync(name);
  if (!fileContents) {
    console.log('Failed to read ' + filename);
    return;
  }
  this.data = exCss.importMarkup(fileContents);
}

// Pre-compiles the file in place.
ExCssFile.prototype.preCompile = function() {
  fs.writeFileSync(this.name, exCss.preCompile(this.data, false));
  console.log('Compilation of ' + this.name + ' successful.');
}

// Statically desugars and compiles the file to plain CSS.
ExCssFile.prototype.staticallyCompile = function() {
  var cssFilename = this.name.replace(/\.excss$/, '') + '.css';
  fs.writeFileSync(cssFilename, exCss.staticallyCompile(this.data));
  console.log('Static compilation to ' + cssFilename + ' successful.');
}

var args = opts.parse({
  s: { aka: 'static' }
});

if (args._.length === 0) {
  console.log([
    'Usage: node ' + process.argv[1] + ' [opts] filename.excss...',
    'Options:',
    '  -s --static  Statically compile a CSS file alongside each ExCSS file.',
    '               Of course, using the CSS file rather than ExCSS will mean ',
    '               that dynamic variables won\'t work in-browser.',
  ].join('\n'));
  process.exit(1);
}

// Create all the files (map) then process them (forEach) so that the global
// variables and traits will be resolved.
args._.map(function(filename) {
  return new ExCssFile(filename);
}).forEach(function(file) {
  file.preCompile();
  if (args.static) {
    file.staticallyCompile();
  }
});
