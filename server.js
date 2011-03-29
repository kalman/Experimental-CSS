// Copyright 2011 Google Inc. All Rights Reserved.
//
// Use of this source code is governed by a BSD-type license.
// See the COPYING file for details.

/**
 * A fairly simple and generic webserver with functionality tailored to ExCSS.
 * Caching is handled automatically; additionally, ExCSS markup is pre-compiled
 * and injected as a CSS comment into the markup before sending to the client.
 * This is then recognised by ExCSS and JSON.parsed rather than the re-parsing.
 *
 * Usage: node server.js [port]
 *
 * Author: Benjamin Kalman <kalman@chromium.org>
 */

var http = require('http');
var fs = require('fs');
var exCss = require('./excss_module.js');

function getRealFilename(filename) {
  // Disallow absolute paths.
  filename = (filename.indexOf('/') === 0) ? filename.slice(1) : filename;
  // Strip the get suffix.
  var indexOfGet = filename.indexOf('?');
  return (indexOfGet > 0) ? filename.slice(0, indexOfGet) : filename;
}

function getFileExtension(filename) {
  var fileExtIndex = filename.lastIndexOf('.');
  return (fileExtIndex >= 0) ?
      filename.slice(fileExtIndex + 1, filename.length) : undefined;
}

function getMimetype(filename) {
  var mimetypes = {
    'css' : 'text/css',
    'html' : 'text/html',
    'ico' : 'image/vnd.microsoft.icon',
    'excss' : 'text/excss',
    'js' : 'text/javascript',
    'json' : 'application/json',
    'jspp' : 'text/harmony',
    'svg' : 'image/svg+xml'
  };
  var fileExt = getFileExtension(filename);
  if (!fileExt) {
    console.warn('No file extension for ' + filename);
    return 'text/plain';
  }
  var mimetype = mimetypes[fileExt];
  if (!mimetype) {
    console.warn('Unknown file extension "' + fileExt + '" for ' + filename);
    return 'text/plain';
  }
  return mimetype;
}

function FileCache() {
  // Entries are of the form { data: ...; atime: ... }.
  this.cache = {};
}

// Gets the value of a file, either from the cache if it's there and up to date,
// or reading from disk if not present in the cache or stale.
FileCache.prototype.get = function(filename, callback) {
  var self = this;
  var cacheEntry = undefined;

  function readFileCallback(err, data) {
    if (err) {
      console.warn('Read error for ' + filename + ': ' + err);
      return callback(err, undefined);
    }
    if (getFileExtension(filename) === 'excss') {
      console.log('Prepending ExCSS object for ' + filename);
      data = exCss.precompile(data);
    }
    cacheEntry.data = data;
    self.cache[filename] = cacheEntry;
    callback(undefined, data);
  }

  function statCallback(err, stat) {
    if (err) {
      // Too many favicon.ico warnings.
      if (filename !== 'favicon.ico') {
        console.warn('Stat error for ' + filename + ': ' + err);
      }
      return callback(err, undefined);
    }
    cacheEntry = self.cache[filename];
    if (cacheEntry) {
      if (stat.mtime <= cacheEntry.atime) {
        return callback(undefined, cacheEntry.data);
      } else {
        console.log(filename + ' has stale cache entry');
      }
    }
    cacheEntry = {
      atime: stat.mtime
    };
    fs.readFile(filename, readFileCallback);
  }

  fs.stat(filename, statCallback);
};

var host = 'localhost';
var port = (process.argv.length > 2) ? process.argv[2] : 8000;
var cache = new FileCache();

http.createServer(function(request, response) {
  var filename = getRealFilename(request.url);
  if (!filename) {
    console.warn('Unexpected request on URL ' + request.url);
    return;
  }
  cache.get(filename, function(err, data) {
    if (err) {
      response.writeHead(404);
      return response.end();
    }
    response.writeHead(200, {'Content-Type': getMimetype(filename)});
    response.end(data);
  });
}).listen(port, host);

console.log('Server started on ' + host + ':' + port + '\n');
var script = process.argv[1];
var testsHtml = script.slice(process.cwd().length,
                             script.length - 'server.js'.length) +
                'tests/tests.html';
console.log('If you\'re running this for ExCSS testing, go to:');
console.log('http://' + host + ':' + port + testsHtml + '\n');
