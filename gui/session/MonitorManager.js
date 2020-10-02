function MonitorManager(viewedPlayer) {
  this.simulationState = Engine.GuiInterfaceCall('GetExtendedSimulationState');

  this.players = [];
  this.playersRes = {};
  this.playerStates = {};
  this.viewedPlayer = viewedPlayer;
  this.lastCheck = Date.now();
  this.tooEarly = false;

  let playerStates = this.simulationState.players;
  for (let playerId in playerStates) {
    let playerState = playerStates[playerId];
    if (playerState.state != "active" || playerState.civ == 'gaia')
      continue;

    this.playersRes[parseInt(playerId)] = [[g_SimState.timeElapsed, playerState.statistics.resourcesGathered]];
  }

  this.update(true, playerStates);
}

MonitorManager.prototype.update = function(forceUpdate = false, playerStates = null) {
  if ((!forceUpdate) && (Engine.IsPaused() || this.tooEarly))
    return;

  playerStates = playerStates || Engine.GuiInterfaceCall('GetExtendedSimulationState').players;
  this.players = [];
  this.playerStates = {};

  if (!(playerStates[this.viewedPlayer] && playerStates[this.viewedPlayer].state == "active")) {
    for (let i = 1; i < playerStates.length; i++)
      if (playerStates[i].state === "active" || playerStates[i].state === "won") {
        this.players.push(i);
      }
  } else
    this.players.push(this.viewedPlayer);

  const now = g_SimState.timeElapsed;

  for (let i = 0; i < this.players.length; i++) {
    const playerId = this.players[i];
    const playerState = playerStates[playerId];
    let pState = this.newPlayerState(playerState);

    if (this.players.length <= 2)
      pState.hideTeam = true;

    const sequences = playerState.sequences;
    const lastIndex = sequences.time.length - 1;

    pState.stats = {}
    const [then, gatheredThen] = this.playersRes[playerId].length > this.IncomeRateBufferSize ? this.playersRes[playerId].shift() : this.playersRes[playerId][0];
    const deltaS = (now - then) / 1000;
    let gatheredNow = playerState.statistics.resourcesGathered;

    delete gatheredNow.vegetarianFood;
    for (let resType in gatheredNow) {
      const resGatheredNow = gatheredNow[resType];
      const rate = (((resGatheredNow - gatheredThen[resType]) / deltaS) * 10).toFixed(0);

      pState.stats[resType] = {
        'count': playerState.resourceCounts[resType],
        'rate': isNaN(rate) ? '' : rate
      };
    }

    this.playersRes[playerId].push([now, gatheredNow]);

	  let totalBought = 0;
	  let totalSold = 0;
    const unitsLost = sequences.unitsLost.total[lastIndex];
    const enemyUnitsKilled = sequences.enemyUnitsKilled.total[lastIndex];
    pState.unitsLost = unitsLost;
    pState.enemyUnitsKilled = enemyUnitsKilled;
    pState.unitsLostValue = sequences.unitsLostValue[lastIndex];
    pState.buildingsLostValue = sequences.buildingsLostValue[lastIndex];
    pState.enemyUnitsKilledValue = sequences.enemyUnitsKilledValue[lastIndex];
    pState.enemyBuildingsDestroyedValue = sequences.enemyBuildingsDestroyedValue[lastIndex];
    pState.buildingsCapturedValue = sequences.buildingsCapturedValue[lastIndex];
    pState.unitsCapturedValue = sequences.unitsCapturedValue[lastIndex];
    pState.loot = sequences.lootCollected[lastIndex];
    const kd = enemyUnitsKilled ? + ((enemyUnitsKilled / unitsLost).toFixed(1)) : 0;
    pState.kd = isFinite(kd) ? kd : '∞';
    pState.tradeIncome = sequences.tradeIncome[lastIndex];
    pState.tributesSent = sequences.tributesSent[lastIndex];
    pState.tributesReceived = sequences.tributesReceived[lastIndex];
    pState.resKilled = pState.enemyUnitsKilledValue + pState.enemyBuildingsDestroyedValue + pState.unitsCapturedValue + pState.buildingsCapturedValue;
    pState.resLost = pState.buildingsLostValue + pState.unitsLostValue;

	  for (let type in sequences.resourcesBought)
	  	totalBought += sequences.resourcesBought[type][lastIndex];
    pState.totalBought = totalBought;

	  for (let type in sequences.resourcesSold)
	  	totalSold += sequences.resourcesSold[type][lastIndex];
    pState.totalSold = totalSold;

    this.playerStates[parseInt(playerId)] = pState;
  }
}

MonitorManager.prototype.TickMillis = 500;
MonitorManager.prototype.IncomeRateBufferSize = 25;

MonitorManager.prototype.isObserver = function() {
  const playerState = this.playerState();

  return !(playerState && playerState.state == "active");
}

MonitorManager.prototype.playerState = function() {
  return this.singlePlayer() && this.playerStates[this.viewedPlayer];
}

MonitorManager.prototype.singlePlayer = function() {
  return this.players.length == 1 && this.players[0] == this.viewedPlayer;
}

MonitorManager.prototype.playerNotActive = function() {
  return this.singlePlayer() && this.playerState().state != "active";
}

MonitorManager.prototype.someoneNotActive = function() {
  const activePlayers = this.players.filter(i => this.playerStates[i].civ != "gaia" && this.playerStates[i].state == "active");

  return (activePlayers.length !== this.players.length);
}

MonitorManager.prototype.newPlayerState = function(playerState) {
  return {
    'name': playerState.name.split(' ')[0],
    'civName': g_CivData[playerState.civ].Name,
    'civ': playerState.civ,
    'color': playerColor(playerState),
    'rgb': playerState.color,
    'brightenedSprite': brightenedSprite(playerState.color),
    'brightenedColor': brightenedColor(playerState.color),
    'darkenedSprite': darkenedSprite(playerState.color),
    'typeCountsByClass': playerState.typeCountsByClass,
    'popLimit': playerState.popLimit,
    'popCount': playerState.popCount,
    'popMax': playerState.popMax,
    'state': playerState.state,
    'team': playerState.team,
    'phase': playerState.phase,
    'phaseName': this.Phases[playerState.phase] || this.phases['village'],
    'hasCC': Object.keys(playerState.typeCountsByClass.CivCentre || {})[0],
    'military': playerState.classCounts.Soldier || 0,
  };
}

MonitorManager.prototype.noPlayers = function() {
  return this.players.length == 0;
}
MonitorManager.prototype.Phases = { 'village': 'I', 'town': 'II', 'city': 'III' };
MonitorManager.prototype.tick = function() {
  const tickNow = Date.now();
  this.tooEarly = !(tickNow - this.lastCheck > this.TickMillis && (this.lastCheck = tickNow));
}
