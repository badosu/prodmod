"use strict";

let g_monitor_Monitor;

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

function monitor_init() {
  const enabled = Engine.ConfigDB_GetValue("user", "monitor.enabled") == "true";
  const showNames = Engine.ConfigDB_GetValue("user", "monitor.showNames") == "true";

  g_monitor_Monitor = new Monitor(g_ViewedPlayer, enabled, showNames);
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

  g_monitor_Monitor.update();

  return result;
});

autociv_patchApplyN("handleInputAfterGui", function (target, that, args)
{
	let [ev] = args;
	if ("hotkey" in ev && ev.hotkey in g_monitor_hotkeys)
  	return !!g_monitor_hotkeys[ev.hotkey](ev);

	return target.apply(that, args);
});
