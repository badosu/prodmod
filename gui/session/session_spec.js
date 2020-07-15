"use strict";

var playerMenu,
  g_Pointer = {x: 0, y: 0};

function onTickSpecMod () {
  playerMenu.update();
}

function initSpecMod () {
  playerMenu = new PlayerMenu();
}

function handleInputSpecMod (e) {
  if (e && e.x)
    g_Pointer = { x: e.x, y: e.y };

  if (!(e && e.type && e.hotkey))
    return;

  if (e.hotkey === 'session.queue')
    playerMenu.toggleQueue();

  if (e.type !== 'hotkeydown') // && !inMenu
    return;

  switch (e.hotkey) {
    case 'session.orderone': playerMenu.toggleEconomics(); break;
    case 'session.garrison': playerMenu.toggleMilitary();  break;
    case 'session.guard':    playerMenu.toggleGatherers(); break;
  }
}

onTick = nestCallback(onTickSpecMod, onTick);
init = nestCallback(initSpecMod, init);
handleInputBeforeGui = nestCallback(handleInputSpecMod, handleInputBeforeGui);

function pp (str) {
  if (typeof str !== 'string')
    str = JSON.stringify(str);

  if (str.length > 1) {
    warn(str.substring(0, 200));
    str = str.substring(200, str.length);
    setTimeout(pp.bind(this, str), 200);
  }
}

/*
function sizeToArray (size) {
  size.split(' ').map((n) => parseInt(n));
}

function moveY (size, val) {

}

function moveX (size, val) {

}

function resizeH (size, val) {

}

function resizeW (size, val) {

}
*/
