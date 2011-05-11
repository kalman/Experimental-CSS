// Copyright 2011 Google Inc. All Rights Reserved.
//
// Use of this source code is governed by a BSD-type license.
// See the COPYING file for details.

/**
 * Basic command-line option parsing utility.
 *
 * Exposes a single function, parse(), which returns a JSO with fields defined
 * for each option, with a list under _ for the unrecognised arguments.
 *
 * While this will put options as getters on the JSO, parse() also accepts a
 * "configuration" object, a mapping of expected options to
 *   - an "aka" value, usually something like "p" aka "port".
 *   - a flag "needsArg", whether the option is expecting an argument.
 *
 * Author: Benjamin Kalman <kalman@chromium.org>
 */

// Opts are a more useful representation of a plain JSO configuration,
// resolving expected args (and its aka if applicable) to getters.
function Opts(config) {
  this.config = config;
  this.values = {};
  this.akas = {};
  var self = this;
  Object.keys(config).forEach(function(opt) {
    function getter() {
      return self.values[opt];
    }
    function setter(value) {
      self.values[opt] = value;
    }
    self.__defineGetter__(opt, getter);
    self.__defineSetter__(opt, setter);
    var optConfig = config[opt] || {};
    if (optConfig.aka) {
      self.__defineGetter__(optConfig.aka, getter);
      self.__defineSetter__(optConfig.aka, setter);
      self.akas[optConfig.aka] = opt;
    }
  });
}

// Gets whether the given option is expecting an argument.
Opts.prototype.needsArg = function(opt) {
  opt = this.akas[opt] || opt;
  return this.config[opt] && this.config[opt].needsArg;
};

// Parses value of process.argv with the given configuration.
exports.parse = function(config) {
  config = config || {};
  var opts = new Opts(config);
  var extra = [];
  var lastOpt;
  process.argv.slice(2).forEach(function(arg) {
    if (arg.indexOf('--') === 0) {
      opts[lastOpt = arg.slice(2)] = true;
    } else if (arg.indexOf('-') === 0) {
      for (var i = 1; i < arg.length; i++) {
        opts[lastOpt = arg[i]] = true;
      }
    } else {
      if (lastOpt && opts.needsArg(lastOpt)) {
        opts[lastOpt] = arg;
      } else {
        extra.push(arg);
      }
      lastOpt = undefined;
    }
  });
  opts._ = extra;
  return opts;
};
