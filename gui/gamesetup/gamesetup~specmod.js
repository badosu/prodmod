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

  sendRegisterGameStanzaImmediate = function ()
  {
  	if (!g_IsController || !Engine.HasXmppClient())
  		return;
  
  	if (g_GameStanzaTimer !== undefined)
  	{
  		clearTimeout(g_GameStanzaTimer);
  		g_GameStanzaTimer = undefined;
  	}
  
  	let clients = formatClientsForStanza();
  	let stanza = {
  		"name": g_ServerName,
  		"port": g_ServerPort,
  		"hostUsername": Engine.LobbyGetNick(),
  		"mapName": g_GameAttributes.map,
  		"niceMapName": getMapDisplayName(g_GameAttributes.map),
  		"mapSize": g_GameAttributes.mapType == "random" ? g_GameAttributes.settings.Size : "Default",
  		"mapType": g_GameAttributes.mapType,
  		"victoryConditions": g_GameAttributes.settings.VictoryConditions.join(","),
  		"nbp": clients.connectedPlayers,
  		"maxnbp": g_GameAttributes.settings.PlayerData.length,
  		"players": clients.list,
  		"stunIP": g_StunEndpoint ? g_StunEndpoint.ip : "",
  		"stunPort": g_StunEndpoint ? g_StunEndpoint.port : "",
  		"mods": JSON.stringify(getFilteredMods(g_GameAttributes)) // <----- THIS CHANGES
  	};
  
  	// Only send the stanza if the relevant settings actually changed
  	if (g_LastGameStanza && Object.keys(stanza).every(prop => g_LastGameStanza[prop] == stanza[prop]))
  		return;
  
  	g_LastGameStanza = stanza;
  	Engine.SendRegisterGame(stanza);
  };
}

autociv_patchApplyN("init", function (target, that, args)
{
	target.apply(that, args);
	monitor_patchModFilter();
})
