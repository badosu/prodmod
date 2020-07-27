"use strict";

let g_prodmod_ProductionMonitor;

const g_prodmod_hotkeys = {
	"prodmod.toggleVisibility": function (ev)
	{
    g_prodmod_ProductionMonitor.toggleVisibility();
		return true;
	},
	"prodmod.toggleMode": function (ev)
	{
    g_prodmod_ProductionMonitor.onModeToggle();
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
	if ("hotkey" in ev && ev.type == "hotkeydown")
	{
		if (ev.hotkey in g_prodmod_hotkeys)
			return !!g_prodmod_hotkeys[ev.hotkey](ev);
	}
	return target.apply(that, args);
});
