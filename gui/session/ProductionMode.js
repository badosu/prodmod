function ProductionMode() {
  Mode.call(this, 'Production', 'Production Overview');
}

ProductionMode.prototype = Object.create(Mode.prototype);

ProductionMode.prototype.getQueues = function(players, simulationState) {
  const playerStates = simulationState.players;

  let queues = {};
  for (let playerId of players) {
    queues[playerId] = [];
  }

  const playerQuery = players.length === 1 ? players[0] : -1;
  const entityStates = Engine.GuiInterfaceCall("prodmod_GetPlayersProduction", playerQuery);
  let foundationCounts = {};

  for (let entityState of entityStates) {
    // Sanity check, in some rare occasions this might happen
    if (!queues[entityState.player])
      continue;

    entityState.tooltip = templateTooltip(playerStates[entityState.player].name, entityState);

    // Push non foundation entities to queue
    if (!entityState.foundation) {
      queues[entityState.player].push(entityState);

      continue;
    }

    // Group buildings into single item
    const key = entityState.player.toString() + entityState.templateName;
    const entry = foundationCounts[key];

    if (!entry) {
      foundationCounts[key] = [1, entityState];
    } else {
      foundationCounts[key][0]++;
      const foundationProgress = foundationCounts[key][1].progress;
      const entityProgress = entityState.progress;
      if (!foundationProgress || (entityProgress && foundationProgress < entityProgress))
        foundationCounts[key][1] = entityState;
    }
  }

  for (let key in foundationCounts) {
    const [count, foundationState] = foundationCounts[key];
    if (count > 1)
      foundationState.count = count;

    foundationState.playerName = playerStates[foundationState.player].name;
    queues[foundationState.player].push(foundationState);
  }

  return queues;
}
