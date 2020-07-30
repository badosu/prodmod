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
  const entityStates = Engine.GuiInterfaceCall("prodmod_GetPlayersProduction", playerQuery).map(e => e.state);
  let foundationCounts = {};

  for (let entityState of entityStates) {
    // Sanity check, in some rare occasions this might happen
    if (!queues[entityState.player])
      continue;

    // Push non foundation entities to queue
    if (!entityState.foundation) {
      entityState.playerName = playerStates[entityState.player].name;

      queues[entityState.player].push(entityState);

      continue;
    }

    // Group buildings into single item
    const key = entityState.player.toString() + entityState.template.name;
    const entry = foundationCounts[key];

    if (!entry) {
      foundationCounts[key] = [1, entityState];
    } else {
      foundationCounts[key][0]++;
      if (foundationCounts[key][1].progress < entityState.progress)
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
