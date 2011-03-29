// Copyright 2011 Google Inc. All Rights Reserved.
//
// Use of this source code is governed by a BSD-type license.
// See the COPYING file for details.

/**
 * Experimental CSS (ExCSS) test library.
 *
 * Tests should include this script and excss.js.
 *
 * Author: Benjamin Kalman <kalman@chromium.org>
 */

(function() {

// I can't help it.  jQuery-esque, but only for ids.
window.$ = function(id) {
  var element = document.getElementById(id);
  if (element) {
    element.expect = function(newExpectation) {
      element.setAttribute('expect', newExpectation);
    };
  }
  return element;
};

// Phases for TESTS.addPhase().
var phases = [];

window.TESTS = {
  // Adds a "phase" to the test.  These are functions which are run after the
  // initial validation of expectations.  After each phase is run, the
  // expectation validation is run again.
  addPhase: function(phase) {
    if (!(phase instanceof Function)) {
      throw new Error('Phase must be a function');
    }
    phases.push(phase);
  },
  // The list of failures.  Global so that the test runner can read it when the
  // test is run from an iframe.
  failures: []
};

function fail(message) {
  window.TESTS.failures.push(message);
}

// Gets whether two style properties are equal by creating temporary elements,
// setting the properties appropriately, then reading off their style values.
// Just asserting that (expected === actual) isn't good enough due to browser
// normalisation, for example, "red" should be equal to "rgb(255, 0, 0)" but
// of course are different under string comparison.
function propertiesAreEqual(property, expected, actual) {
  function createAndAppendDivWithValue(parent, value) {
    var div = document.createElement('div');
    div.setAttribute('style', property + ': ' + value);
    parent.appendChild(div);
    return div;
  };

  var expectedDiv = createAndAppendDivWithValue(document.body, expected);
  var actualDiv = createAndAppendDivWithValue(document.body, actual);

  var areEqual = window.getComputedStyle(expectedDiv)[property] ===
                 window.getComputedStyle(actualDiv)[property];

  document.body.removeChild(expectedDiv);
  document.body.removeChild(actualDiv);

  return areEqual;
}

// Gets whether a property is a valid style property, e.g. "color" is valid
// while "colorp" is, presumably, not.
function isValidProperty(property) {
  return property in window.getComputedStyle(document.body);
}

// Gets a string representation of a DOM element nicely for logging.
function showElement(element) {
  var tag = element.tagName.toLowerCase();
  var attributeString = '';
  for (var i = 0; i < element.attributes.length; i++) {
    var attribute = element.attributes[i];
    if (attribute.name !== 'expect') {
      attributeString += ' ' + attribute.name + '=\"' + attribute.value + '\"';
    }
  }
  return '<' + tag + attributeString + '>' + element.innerText + '</' + tag + '>';
}

// Parses elements with style property expectations (read from the "expect"
// attribute of the element) and asserts that each element does indeed have the
// expected computed style(s).
function checkExpectations(phaseName) {
  var elements = Array.prototype.slice.call(document.querySelectorAll('div[expect]'));
  elements.forEach(function(element) {
    element.getAttribute('expect').split(';').forEach(function(expectation) {
      var propertyAndExpectedValue = expectation.split(':');
      if (propertyAndExpectedValue.length !== 2) {
        fail(phaseName + ": Couldn't parse property/expected value from \"" + expectation + '\"');
        return;
      }

      var property = propertyAndExpectedValue[0].trim();
      if (!isValidProperty(property)) {
        fail(phaseName + ': Invalid or unsupported property ' + property);
        return;
      }

      var expectedValue = propertyAndExpectedValue[1].trim();
      var actualValue = window.getComputedStyle(element)[property];
      if (!propertiesAreEqual(property, expectedValue, actualValue)) {
        fail(phaseName + ': ' + showElement(element) +
             ' expected ' + property + ' ' + expectedValue + ' but got ' + actualValue);
      }
    });
  });
}

var beforeTest = window.onload;

window.onload = function() {
  if (beforeTest instanceof Function) {
    beforeTest();
  }

  var phaseName = 'Initial phase';
  try {
    checkExpectations(phaseName);
    phases.forEach(function(phase, i) {
      phaseName = 'Additional phase ' + (i + 1);
      phase();
      checkExpectations(phaseName);
    });
  } catch (e) {
    fail(phaseName + ': exception thrown while checking expectations in phase: ' + e);
  }

  var log = document.createElement('pre');
  document.body.appendChild(log);
  var failures = window.TESTS.failures;
  if (failures.length > 0) {
    log.setAttribute('style', 'color: red');
    failures.forEach(function(failure) {
      log.innerText += 'FAIL: ' + failure + '\n';
    });
  } else {
    log.setAttribute('style', 'color: green');
    log.innerText = 'PASS';
  }
};

}());
