"use strict";

let g_prodmod_ProductionMonitor;

// TODO: Use a24 registerPlayersInitHandler
autociv_patchApplyN("init", function(target, that, args) {
	const result = target.apply(that, args);

  g_prodmod_ProductionMonitor = new ProductionMonitor(g_ViewedPlayer);

  return result;
});

// TODO: Use a24 registerSimulationUpdateHandler
autociv_patchApplyN("onTick", function(target, that, args) {
	const result = target.apply(that, args);

  g_prodmod_ProductionMonitor.update();

  return result;
});
