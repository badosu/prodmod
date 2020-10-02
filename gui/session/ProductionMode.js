function ProductionMode() {
  Mode.call(this, 'Production', 'Production Overview');
}

ProductionMode.prototype = Object.create(Mode.prototype);

ProductionMode.prototype.getQueues = function() {
  const playerStates = g_monitor_Manager.playerStates;

  let queues = {};
  for (let playerId in playerStates)
    queues[playerId] = [];

  const playerQuery = g_monitor_Manager.players.length === 1 ? g_monitor_Manager.players[0] : -1;
  const entityStates = Engine.GuiInterfaceCall("monitor_GetPlayersProduction", playerQuery);
  let entityCounts = {};

  // Group entities with same template
  for (let entityState of entityStates) {
    // Sanity check, in some rare occasions this might happen
    if (!queues[entityState.player])
      continue;

    entityState.tooltip = templateTooltip(playerStates[entityState.player], entityState);

    const key = entityState.player.toString() + entityState.templateName;

    if (!entityCounts[key]) {
      entityCounts[key] = entityState;
      entityCounts[key].count = entityState.count || 1;
    } else {
      const cachedProgress = entityCounts[key].progress;
      if (!cachedProgress || (entityState.progress && cachedProgress < entityState.progress)) {
        entityState.count = entityCounts[key].count + (entityState.count || 1);
        entityCounts[key] = entityState;
      } else {
        entityCounts[key].count += (entityState.count || 1);
      }
    }
  }

  for (let key in entityCounts) {
    const entityState = entityCounts[key];

    entityState.playerName = playerStates[entityState.player].name;
    queues[entityState.player].push(entityState);
  }

  return queues;
}
