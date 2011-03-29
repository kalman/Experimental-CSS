// Copyright 2011 Google Inc. All Rights Reserved.
//
// Use of this source code is governed by a BSD-type license.
// See the COPYING file for details.

/**
 * Silly behaviour for the toy button examples.
 *
 * Author: Benjamin Kalman <kalman@chromium.org>
 */

(function() {

  function createButton(theme, text) {
    var button = document.createElement("span");
    button.className = theme;
    button.innerHTML = text;
    return button;
  }

  function attachClickBehaviour(button, clickHandler) {
    button.onclick = clickHandler;
  }

  function attachToggleBehaviour(button, onToggleOn, onToggleOff) {
    button.onclick = function() {
      if (button.__toggled) {
        button.classList.remove("toggled");
        button.__toggled = false;
        onToggleOff();
      } else {
        button.classList.add("toggled");
        button.__toggled = true;
        onToggleOn();
      }
    };
  }

  var button1 = createButton("neutralButton", "Foo");
  attachClickBehaviour(button1,
    function() {alert("button1 clicked")});

  var button2 = createButton("neutralButton", "Bar");
  attachToggleBehaviour(button2,
    function() {alert("button2 on")},
    function() {alert("button2 off")});

  var button3 = createButton("themedButton", "Baz");
  attachClickBehaviour(button3,
    function() {alert("button3 clicked")});

  var button4 = createButton("themedButton", "Qux");
  attachToggleBehaviour(button4,
    function() {alert("button4 on")},
    function() {alert("button4 off")});

  document.body.appendChild(button1);
  document.body.appendChild(button2);
  document.body.appendChild(button3);
  document.body.appendChild(button4);

})();
