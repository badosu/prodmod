"use strict";

let g_monitor_Monitor;
let g_monitor_TopPanel;
let g_monitor_Manager;

const g_monitor_hotkeys = {
	"monitor.toggleShowNames": function (ev) {
    if (ev.type == "hotkeydown")
      g_monitor_Monitor.toggleShowNames();
		return true;
	},
	"monitor.toggleVisibility": function (ev) {
    if (ev.type == "hotkeydown")
      g_monitor_Monitor.toggleVisibility();
		return true;
	},
	"monitor.toggleMode": function (ev) {
    if (ev.type == "hotkeydown")
      g_monitor_Monitor.onModeToggle();
		return true;
	},
	"monitor.quickShowUnits": function (ev) {
    if (ev.type == "hotkeydown") {
      g_monitor_Monitor.show(0);
      g_monitor_Monitor.update(true);
    } else {
      g_monitor_Monitor.hide();
    }
		return true;
	},
	"monitor.quickShowProduction": function (ev) {
    if (ev.type == "hotkeydown") {
      g_monitor_Monitor.show(1);
      g_monitor_Monitor.update(true);
    } else {
      g_monitor_Monitor.hide();
    }
		return true;
	},
	"monitor.quickShowTech": function (ev) {
    if (ev.type == "hotkeydown") {
      g_monitor_Monitor.show(2);
      g_monitor_Monitor.update(true);
    } else {
      g_monitor_Monitor.hide();
    }
		return true;
	},
};

function prodmod_updateTopPanel()
{
  const isPlayer = g_ViewedPlayer > 0;

  let viewPlayer = Engine.GetGUIObjectByName("viewPlayer");
  viewPlayer.hidden = !g_IsObserver && !g_DevSettings.changePerspective;

  Engine.GetGUIObjectByName("diplomacyButton").hidden = !isPlayer;
  Engine.GetGUIObjectByName("tradeButton").hidden = !isPlayer;
  Engine.GetGUIObjectByName("optionFollowPlayer").hidden = !isPlayer;
  let topPanelWidth = isPlayer ? 508 : 430;

  Engine.GetGUIObjectByName("topPanel").size = "100%-" + topPanelWidth.toString() + " 0 100%+3 36";//"-3 0 100%+3 36"
  Engine.GetGUIObjectByName("tradeButton").size = "100%-503 4 100%-475 32";//"100%-224 4 100%-196 32"
  Engine.GetGUIObjectByName("diplomacyButton").size = "100%-475 4 100%-447 32";//"100%-254 4 100%-226 32"
  Engine.GetGUIObjectByName("optionFollowPlayer").size = "100%-447 4 100%-427 100%"; //"50%+54 4 50%+256 100%"
  Engine.GetGUIObjectByName("viewPlayer").size = "100%-424 5 100%-224 100%-5";//"85%-279 5 100%-293 100%-5"
  Engine.GetGUIObjectByName("gameSpeedButton").size = "100%-222 4 100%-194 32";//"100%-284 4 100%-256 32"

  Engine.GetGUIObjectByName("pauseButton").enabled = !g_IsObserver || !g_IsNetworked || g_IsController;
  Engine.GetGUIObjectByName("menuResignButton").enabled = !g_IsObserver;
  Engine.GetGUIObjectByName("lobbyButton").enabled = Engine.HasXmppClient();
}

function replaceTopPanel() {
  autociv_patchApplyN("updateTopPanel", function(_target, that, args) {
    prodmod_updateTopPanel.apply(that, args);
  });

  autociv_patchApplyN("updatePlayerDisplay", function(_target, _that, _args) {
    Engine.GetGUIObjectByName("observerText").hidden = true;
    Engine.GetGUIObjectByName("followPlayerLabel").hidden = true;
    Engine.GetGUIObjectByName("population").hidden = true;
    Engine.GetGUIObjectByName("resourceCounts").hidden = true;
    Engine.GetGUIObjectByName("civIcon").hidden = true;

    updateTopPanel()
  });

  g_monitor_TopPanel = new MonitorTopPanel();
}

function monitor_init() {
  const enabled = Engine.ConfigDB_GetValue("user", "monitor.enabled") == "true";
  const showNames = Engine.ConfigDB_GetValue("user", "monitor.showNames") == "true";
  const shouldReplaceTopPanel = Engine.ConfigDB_GetValue("user", "monitor.replaceTopPanel") == "true";

  g_monitor_Manager = new MonitorManager(g_ViewedPlayer);

  if (shouldReplaceTopPanel)
    replaceTopPanel();

  g_monitor_Monitor = new Monitor(enabled, showNames);
}

// TODO: Use a24 registerPlayersInitHandler
autociv_patchApplyN("init", function(target, that, args) {
	const result = target.apply(that, args);

  monitor_init()

  return result;
});

// TODO: Use a24 registerSimulationUpdateHandler
autociv_patchApplyN("onTick", function(target, that, args) {
	const result = target.apply(that, args);

  g_monitor_Manager.update()

  if (!g_monitor_Manager.tooEarly) {
    if (g_monitor_Monitor.active)
      g_monitor_Monitor.update();

    if (g_monitor_TopPanel)
      g_monitor_TopPanel.update();
  }

  g_monitor_Manager.tick()

  return result;
});

let dragging = false;
autociv_patchApplyN("handleInputBeforeGui", function (target, that, args)
{
	let [ev, el] = args;
  
  const isHoveringMonitorEl = el && el.tooltip && el.tooltip.indexOf('Overview') > -1;

  if (dragging && ev.type == 'mousebuttonup' && ev.button == 3)
    dragging = false;

  if (!isHoveringMonitorEl)
    return target.apply(that, args);

  if (ev.type == 'mousebuttondown' && ev.button == 3)
    dragging = true;
  else if (dragging && ev.type == 'mousemotion')
    g_monitor_Monitor.setPos(ev.x, ev.y);

	return target.apply(that, args);
});

autociv_patchApplyN("handleInputAfterGui", function (target, that, args)
{
	let [ev] = args;

	if ("hotkey" in ev && ev.hotkey in g_monitor_hotkeys)
  	return !!g_monitor_hotkeys[ev.hotkey](ev);

	return target.apply(that, args);
});
