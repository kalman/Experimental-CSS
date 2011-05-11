// Copyright 2011 Google Inc. All Rights Reserved.
//
// Use of this source code is governed by a BSD-type license.
// See the COPYING file for details.

/**
 * Exposes part of the ExCSS API for use from nodejs.
 *
 * Author: Benjamin Kalman <kalman@chromium.org>
 */

// Import ExCSS with a fake window.  We don't actually need to emulate anything
// (e.g. document) since ExCSS won't access any of the DOM API unless it's run
// in the browser, but we need to define it so that it can export the ExCSS API,
// which is needed for CSS.parse.
var savedGlobalWindow = global.window;
global.window = {};
require('./excss.js');
var CSS = global.window.CSS;
global.window = savedGlobalWindow;

// Parses some ExCSS markup, then imports the variables and traits from a
// stylesheet into the CSS object.
// Returns an object with the existing markup and parse object.
exports.importMarkup = function(markup) {
  // Node doesn't give us Strings.
  if (!(markup instanceof String)) {
    markup = new String(markup);
  }
  var result = CSS.extractMarkupAndParseObject(markup);
  // Ignore the existing parse object, since it might be out of date.
  result.parseObject = undefined;
  try {
    result.parseObject = CSS.parse(result.markup);
  } catch (e) {
    console.warn('Exception thrown while parsing ExCSS: ' + e);
  }
  if (!result.parseObject) {
    console.warn('Could not parse ExCSS markup ' + markup);
    return undefined;
  }
  // Import variables and traits.
  CSS.importParseObject(result.parseObject);
  return result;
}

// Creates new ExCSS markup derived from the object returned from import(),
// with the original markup plus the parse object attached as JSON in a comment.
exports.preCompile = function(markupAndParseObject, insertAtStart) {
  var markup = markupAndParseObject.markup.trim();
  var json = JSON.stringify(markupAndParseObject.parseObject);
  if (insertAtStart) {
    return '/*{{{' + json + '}}}*/\n\n' + markup;
  } else {
    return markup + '\n\n/*{{{' + json + '}}}*/\n';
  }
};

// Compiles the object returned from import() into static CSS.
exports.staticallyCompile = function(markupAndParseObject) {
  return CSS.prettyPrint(markupAndParseObject.parseObject);
};
