"use strict";

let g_prodmod_ProductionMonitor;

const g_prodmod_hotkeys = {
	"prodmod.toggleVisibility": function (ev)
	{
    if (ev.type == "hotkeydown")
      g_prodmod_ProductionMonitor.toggleVisibility();
		return true;
	},
	"prodmod.toggleMode": function (ev)
	{
    if (ev.type == "hotkeydown")
      g_prodmod_ProductionMonitor.onModeToggle();
		return true;
	},
	"prodmod.quickShowUnits": function (ev)
	{
    if (ev.type == "hotkeydown") {
      g_prodmod_ProductionMonitor.show(0);
      g_prodmod_ProductionMonitor.update(true);
    } else {
      g_prodmod_ProductionMonitor.hide();
    }
		return true;
	},
	"prodmod.quickShowProduction": function (ev)
	{
    if (ev.type == "hotkeydown") {
      g_prodmod_ProductionMonitor.show(1);
      g_prodmod_ProductionMonitor.update(true);
    } else {
      g_prodmod_ProductionMonitor.hide();
    }
		return true;
	},
};

function prodmod_init() {
  const enabled = Engine.ConfigDB_GetValue("user", "prodmod.enabled") == "true";

  g_prodmod_ProductionMonitor = new ProductionMonitor(g_ViewedPlayer, enabled);
}

// TODO: Use a24 registerPlayersInitHandler
autociv_patchApplyN("init", function(target, that, args) {
	const result = target.apply(that, args);

  prodmod_init()

  return result;
});

// TODO: Use a24 registerSimulationUpdateHandler
autociv_patchApplyN("onTick", function(target, that, args) {
	const result = target.apply(that, args);

  g_prodmod_ProductionMonitor.update();

  return result;
});

autociv_patchApplyN("handleInputAfterGui", function (target, that, args)
{
	let [ev] = args;
	if ("hotkey" in ev && ev.hotkey in g_prodmod_hotkeys)
  	return !!g_prodmod_hotkeys[ev.hotkey](ev);

	return target.apply(that, args);
});
