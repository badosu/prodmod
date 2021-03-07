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

function replaceTopPanel() {
  CivIcon.prototype.rebuild = function () { warn('nop') };
  g_monitor_TopPanel = new MonitorTopPanel();
  g_monitor_TopPanel.updateLayout();

  g_monitor_Manager.addPlayersChangedHandler(g_monitor_TopPanel.reset.bind(g_monitor_TopPanel));
}

function monitor_init() {
  const enabled = Engine.ConfigDB_GetValue("user", "monitor.enabled") == "true";
  const showNames = Engine.ConfigDB_GetValue("user", "monitor.showNames") == "true";
  const shouldReplaceTopPanel = Engine.ConfigDB_GetValue("user", "monitor.replaceTopPanel") == "true";

  g_monitor_Manager = new MonitorManager(g_ViewedPlayer);

  if (shouldReplaceTopPanel)
    replaceTopPanel();

  g_monitor_Monitor = new Monitor(enabled, showNames);
  g_monitor_Manager.addPlayersChangedHandler(g_monitor_Monitor.reset.bind(g_monitor_Monitor));
}

function monitor_tick() {
  g_monitor_Manager.update()

  if (!g_monitor_Manager.tooEarly) {
    if (g_monitor_Monitor.active)
      g_monitor_Monitor.update();

    if (g_monitor_TopPanel)
      g_monitor_TopPanel.update();
  }

  g_monitor_Manager.tick()
}

registerPlayersInitHandler(monitor_init);
registerSimulationUpdateHandler(monitor_tick);

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
