"use strict";

var playerMenu;

function onTickSpecMod () {
  playerMenu.update();
}

function initSpecMod () {
  playerMenu = new PlayerMenu();
}

onTick = nestCallback(onTickSpecMod, onTick);
init = nestCallback(initSpecMod, init);

function pp (str) {
  if (typeof str === 'undefined') {
    str = 'undefined';
  } else if (typeof str !== 'string') {
    str = JSON.stringify(str);
  }

  warn(str);
}
