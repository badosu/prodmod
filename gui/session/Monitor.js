function Monitor(active = true, showNames = true, mode = 0, modes = [UnitsMode, ProductionMode, TechMode]) {
  this.container = Engine.GetGUIObjectByName('Monitor');
  this.title = Engine.GetGUIObjectByName('MonitorTitle');
  this.titleContainer = Engine.GetGUIObjectByName('MonitorTitleContainer');
  this.showNames = showNames;

  const posX = +Engine.ConfigDB_GetValue("user", "monitor.pos.x");
  const posY = +Engine.ConfigDB_GetValue("user", "monitor.pos.y");
  if (posX && posY)
    this.pos = { 'left': parseInt(posX), 'top': parseInt(posY) };
  else
    this.pos = null;

  this.scale = +Engine.ConfigDB_GetValue("user", "gui.scale");
  this.showPhase = Engine.ConfigDB_GetValue("user", "monitor.showPhase") == "true";

  this.modes = modes.map((m) => {
    let instance = Object.create(m.prototype);
    m.apply(instance, []);
    return instance;
  });
  this.mode = mode;
  this.active = active;
  this.rows = {};

  this.titleContainer.onPress = this.onModeToggle.bind(this);

  this.reset();
}

Monitor.prototype.setPos = function(x, y) {
  this.pos = { 'top': Math.round(y / this.scale) - 8, 'left': Math.round(x / this.scale) - 8 };
  this.show();
}

Monitor.prototype.reset = function() {
  if (g_IsObserver)
    this.showNames = false;

  // Hide previous rows if reset from previous state
  for (let row in this.rows)
    this.rows[row].hide();

  const playerStates = g_monitor_Manager.playerStates;
  this.rows = {};
  let rowIndex = 0;
  for (let playerId in playerStates) {
    this.rows[playerId] = new MonitorRow(rowIndex, playerId);

    rowIndex++;
  }

  if (this.active)
    this.show();
}

Monitor.prototype.onModeToggle = function() {
  this.mode++;
  this.mode %= Object.keys(this.modes).length;

  this.show();
  this.update();
}

Monitor.prototype.toggleShowNames = function() {
  this.showNames = !this.showNames;
  this.update();
}

Monitor.prototype.currentMode = function() {
  return this.modes[this.mode];
}

Monitor.prototype.update = function() {
  if (g_monitor_Manager.noPlayers()) {
    this.hide();
    return;
  }

  const queues = this.modes[this.mode].getQueues();

  if (this.showPhase)
    this.addPhaseToQueues(queues);

  this.updateRows(queues);
}

Monitor.prototype.updateRows = function(queues) {
  const playerStates = g_monitor_Manager.playerStates;
  let maxItems = 0;
  for (let playerId of g_monitor_Manager.players) {
    // Sanity check, just for the sake
    if (!queues[playerId] || !this.rows[playerId]) continue;

    const queueLength = queues[playerId].length;
    if (queueLength > maxItems)
      maxItems = queueLength;

    let playerState = playerStates[playerId];
    playerState.id = playerId;

    this.rows[playerId].update(queues[playerId], this.showNames);
  }

  maxItems = Math.min(maxItems, 20);

  let size = this.container.size;
  let rightmostItem = this.rows[Object.keys(this.rows)[0]].items[Math.max(maxItems - 1, 0)].btn.size;
  size.right = Math.max(maxItems > 0 ? rightmostItem.right : rightmostItem.left, this.titleContainer.size.right) + 8;
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
  if (this.pos) {
    size.top = this.pos.top;
    size.left = this.pos.left;
  } else
    size.top = g_monitor_Manager.singlePlayer() ? this.TopSingle : this.Top;

  size.bottom = this.TitleHeight + MonitorRow.prototype.MarginTop + g_monitor_Manager.players.length * (
    MonitorRow.prototype.VerticalGap + MonitorRow.prototype.Height
  ) + size.top;
  this.container.size = size;

  if (g_IsObserver) {
    this.title.caption = this.modes[this.mode].getLabel();
    this.titleContainer.tooltip = this.modes[this.mode].getTooltip();
    this.titleContainer.hidden = false;
  }

  this.container.hidden = false;
}

Monitor.prototype.addPhaseToQueues = function(queues) {
  const phaseTechs = g_monitor_Manager.getPhaseTechs();

  for (let playerId in phaseTechs) {
    const phaseTech = phaseTechs[playerId];
    if (phaseTech && queues[playerId]) {
      phaseTech.tooltip = templateTooltip(g_monitor_Manager.playerStates[playerId], phaseTech);
      queues[playerId].unshift(phaseTech)
    }
  }
}

Monitor.prototype.TitleHeight = 20;
Monitor.prototype.Top = 420;
Monitor.prototype.TopSingle = 84;
Monitor.prototype.Ranks = { 'b': 'Basic', 'a': 'Advanced', 'e': 'Elite' };
