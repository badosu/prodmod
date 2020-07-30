function Monitor(viewedPlayer, active = true, mode = 0, modes = [UnitsMode, ProductionMode, TechMode]) {
  this.container = Engine.GetGUIObjectByName('Monitor');
  this.title = Engine.GetGUIObjectByName('MonitorTitle');
  this.titleContainer = Engine.GetGUIObjectByName('MonitorTitleContainer');

  this.modes = modes.map((m) => {
    let instance = Object.create(m.prototype);
    m.apply(instance, []);
    return instance;
  });
  this.mode = mode;
  this.lastCheck = Date.now();
  this.viewedPlayer = viewedPlayer;
  this.active = active;
  this.rows = {};

  this.titleContainer.onPress = this.onModeToggle.bind(this);

  this.reset();
}

Monitor.prototype.reset = function(simulationState = Engine.GuiInterfaceCall('GetSimulationState')) {
  this.simulationState = simulationState;

  const playerStates = simulationState.players;
  const isObserver = !playerStates[this.viewedPlayer] || playerStates[this.viewedPlayer].state != "active";

  if (isObserver) {
    this.players = [];
    for (let i = 1; i < playerStates.length; i++)
      if (playerStates[i].state === "active")
        this.players.push(i);
  } else
    this.players = [this.viewedPlayer];

  // Hide previous rows if reset from previous state
  for (let row in this.rows)
    this.rows[row].hide();

  this.rows = {};
  for (let i = 0; i < this.players.length; i++) {
    const playerId = this.players[i];
    const playerState = playerStates[playerId];
    const civName = g_CivData[playerState.civ].Name;
    this.rows[playerId] = new MonitorRow(i, `${playerState.name} - ${civName}`, isObserver, playerState.color);
  }

  if (this.active)
    this.show();
}

Monitor.prototype.onModeToggle = function() {
  this.mode++;
  this.mode %= Object.keys(this.modes).length;

  this.show();
  this.update(true);
}

Monitor.prototype.currentMode = function() {
  return this.modes[this.mode];
}

Monitor.prototype.update = function(forceRender = false) {
  if (!this.active || (Engine.IsPaused() || (!forceRender && this.tooEarly())))
    return;

  this.simulationState = Engine.GuiInterfaceCall('GetSimulationState')
  const playerStates = this.simulationState.players;

  // Reset Monitor when a player is not active anymore
  // TODO: Use a24 registerPlayersFinishedHandler
  if (this.singlePlayer()) {
    if (playerStates[this.viewedPlayer].state != "active")
      this.reset(this.simulationState);
  } else {
    const activePlayers = playerStates.filter(playerState => playerState.civ != "gaia" && playerState.state == "active");
    if (activePlayers.length !== this.players.length)
      this.reset(this.simulationState);
  }

  const queues = this.modes[this.mode].getQueues(this.players, this.simulationState);

  this.updateRows(queues);
}

Monitor.prototype.updateRows = function(queues) {
  let maxItems = 0;
  for (let playerId of this.players) {
    // Sanity check, just for the sake
    if (!queues[playerId])
      continue;

    const queueLength = queues[playerId].length;
    if (queueLength > maxItems)
      maxItems = queueLength;

    this.rows[playerId].update(queues[playerId]);
  }

  let size = this.container.size;
  size.right = MonitorItem.prototype.LeftMargin + MonitorItem.prototype.ButtonWidth +
    (MonitorItem.prototype.ButtonWidth + MonitorItem.prototype.HorizontalGap) * Math.max(maxItems - 1, 0);
  this.container.size = size;
}

Monitor.prototype.hide = function() {
  this.active = false;
  this.container.hidden = true;
}

Monitor.prototype.toggleVisibility = function() {
  this.active ? this.hide() : this.show();
}

Monitor.prototype.show = function(mode = this.mode) {
  this.mode = mode;
  this.active = true;

  const size = this.container.size;
  size.top = this.singlePlayer() ? this.TopSingle : this.Top;
  size.bottom = this.TitleHeight + MonitorRow.prototype.MarginTop + this.players.length * (
    MonitorRow.prototype.VerticalGap + MonitorRow.prototype.Height
  ) + size.top;
  this.container.size = size;

  if (!this.singlePlayer()) {
    this.title.caption = this.modes[this.mode].getLabel();
    this.titleContainer.tooltip = this.modes[this.mode].getTooltip();
    this.titleContainer.hidden = false;
  }

  this.container.hidden = false;
}

Monitor.prototype.singlePlayer = function() {
  return this.players.length == 1;
}

Monitor.prototype.tooEarly = function() {
  const now = Date.now();

  return !(now - this.lastCheck > this.TickMillis && (this.lastCheck = now));
}

Monitor.prototype.TitleHeight = 20;
Monitor.prototype.TickMillis = 500;
Monitor.prototype.Top = 420;
Monitor.prototype.TopSingle = 84;
Monitor.prototype.Ranks = { 'b': 'Basic', 'a': 'Advanced', 'e': 'Elite' };
