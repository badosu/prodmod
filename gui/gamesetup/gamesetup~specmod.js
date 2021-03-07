function monitor_patchModFilter()
{
  if (!global["getFilteredMods"])
    global["getFilteredMods"] = function(gameData) { return Engine.GetEngineInfo().mods };

  autociv_patchApplyN("getFilteredMods", function (target, that, args)
  {
  	let mod = ([name, _version]) => !/^monitor.*/i.test(name);
  	return target.apply(that, args).filter(mod);
  });

  autociv_patchApplyN("getFilteredMods", function (target, that, args)
  {
  	let mod = ([name, version]) => !/^FGod.*/i.test(name);
  	return target.apply(that, args).filter(mod);
  });

  autociv_patchApplyN("getFilteredMods", function (target, that, args)
  {
  	let mod = ([name, version]) => !/^AutoCiv.*/i.test(name);
  	return target.apply(that, args).filter(mod);
  });
}

autociv_patchApplyN("init", function (target, that, args)
{
	target.apply(that, args);
	monitor_patchModFilter();
})
