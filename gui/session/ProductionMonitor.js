function ProductionMonitor(viewedPlayer) {
  this.container = Engine.GetGUIObjectByName('productionMonitor');
  this.title = Engine.GetGUIObjectByName('productionMonitorTitle');
  this.titleContainer = Engine.GetGUIObjectByName('productionMonitorTitleContainer');
  this.lastCheck = Date.now();
  this.viewedPlayer = viewedPlayer;

  this.reset(Engine.GuiInterfaceCall('GetSimulationState').players);
}

ProductionMonitor.prototype.reset = function(playerStates) {
  const isObserver = !playerStates[this.viewedPlayer] || playerStates[this.viewedPlayer].state != "active";

  this.players = isObserver ?
    Array(playerStates.length - 1).fill(0).map((_x, i) => i + 1)
    : [this.viewedPlayer];

  this.rows = {};
  for (let playerId of this.players) {
    const rowIndex = isObserver ? playerId - 1 : 0;
    const playerColor = playerStates[playerId].color;

    this.rows[playerId] = new ProductionRow(rowIndex, isObserver, playerColor);
  }

  this.show();
}

ProductionMonitor.prototype.update = function () {
  if (Engine.IsPaused() || this.tooEarly())
    return;

  const playerStates = Engine.GuiInterfaceCall('GetSimulationState').players;
  const isObserver = !playerStates[this.viewedPlayer] || playerStates[this.viewedPlayer].state != "active";

  //const first = Engine.GetMicroseconds();

  // Switch to overview when user was a player and is defeated or wins
  // TODO: Use a24 registerPlayersFinishedHandler
  if (this.singlePlayer() && isObserver)
    this.reset(playerStates);

  let queues = {};
  for (let playerId of this.players) {
    queues[playerId] = [];
  }

  const entities = Engine.GuiInterfaceCall("prodmod_GetPlayersProduction",
    this.singlePlayer() ? this.players[0] : null
  );

  //pp("ents: " + ((Engine.GetMicroseconds() - first) / 1000).toFixed(6) + "ms.\n");

  for (let entity of entities) {
    queues[entity.state.player].push(entity.state);
  }

  for (let playerId of this.players) {
    this.rows[playerId].update(queues[playerId]);
  }

  //pp("gui: " + ((Engine.GetMicroseconds() - first) / 1000).toFixed(6) + "ms.\n");
  //pp("!!!");
}

ProductionMonitor.prototype.show = function() {
  const size = this.container.size;

  size.top = this.singlePlayer() ? this.TopSingle : this.Top;

  if (!this.singlePlayer()) {
    this.title.caption = this.Title;
    this.titleContainer.hidden = false;
  }

  this.container.size = size;
  this.container.hidden = false;
}

ProductionMonitor.prototype.singlePlayer = function() {
  return this.players.length == 1;
}

ProductionMonitor.prototype.tooEarly = function() {
  const now = Date.now();

  return !(now - this.lastCheck > this.TickMillis && (this.lastCheck = now));
}

ProductionMonitor.prototype.Title = "Production";
ProductionMonitor.prototype.TitleHeight = 20;
ProductionMonitor.prototype.TickMillis = 500;
ProductionMonitor.prototype.Top = 420;
ProductionMonitor.prototype.TopSingle = 84;

function ProductionItem(rowIndex, itemIndex, color) {
  this.itemIndex = itemIndex;
  this.icon = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]Item[${itemIndex}]Icon`);
  this.btn = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]Item[${itemIndex}]Btn`);
  this.cnt = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]Item[${itemIndex}]Count`);
  this.progress = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]Item[${itemIndex}]Prg`);
  this.progress.sprite = brightenedSprite(color);

  const buttonLeft = this.LeftMargin + (this.ButtonWidth + this.HorizontalGap) * this.itemIndex;
  let size = this.btn.size;
  size.left = buttonLeft;
  size.right = buttonLeft + this.ButtonWidth;
  this.btn.size = size;

  this.btn.onPress = this.onPress.bind(this);
}

ProductionItem.prototype.update = function(item) {
  this.item = item;
  this.icon.sprite = this.PortraitDirectory + item.template.icon;

  let btnSize = this.btn.size;
  let progressSize = this.progress.size;
  if (item.progress && (!item.foundation || item.hitpoints > 1)) {
    this.progress.hidden = false;
    btnSize.bottom = this.ButtonWidth + this.ProgressBarHeight;
    progressSize.right = this.BorderWidth + (this.ButtonWidth - 2 * this.BorderWidth) * item.progress;
  } else {
    this.progress.hidden = true;
    btnSize.bottom = this.ButtonWidth;
  }
  this.progress.size = progressSize;
  this.btn.size = btnSize;

  let tooltip = item.template.name;
  if (item.timeRemaining && (!item.foundation || item.timeRemaining > 0)) {
    tooltip += " - " + Math.ceil(item.timeRemaining) + "s"
  }

  this.btn.tooltip = tooltip;
  this.btn.hidden = false;

  if (item.production && item.production.kind == "unit") {
    this.cnt.caption = item.production.count;
  } else {
    this.cnt.caption = "";
  }
}

ProductionItem.prototype.onPress = function() {
  if (!this.item.position)
    return;

  Engine.CameraMoveTo(this.item.position.x, this.item.position.z);
}

ProductionItem.prototype.hide = function() {
  this.btn.hidden = true;
  this.progress.hidden = true;
}

ProductionItem.prototype.LeftMargin = 12;
ProductionItem.prototype.HorizontalGap = 2;
ProductionItem.prototype.ButtonWidth = 34;
ProductionItem.prototype.BorderWidth = 3;
ProductionItem.prototype.ProgressBarHeight = 3;
ProductionItem.prototype.PortraitDirectory = "stretched:session/portraits/";

function ProductionRow(rowIndex, displayLabel, color = { r: 255, g: 255, b: 255 }) {
  let menu = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]`);
  let ind = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]Ind`);
  let sizeTop = rowIndex * this.Height + this.VerticalGap;
  if (displayLabel)
    sizeTop += ProductionMonitor.prototype.TitleHeight;

  menu.size = `0 ${sizeTop} ${this.MaxWidth} ${sizeTop + this.Height}`;
  menu.hidden = false;
  const colorSprite = `color: ${color.r * 255} ${color.g * 255} ${color.b * 255} 255`;
  ind.sprite = colorSprite;

  this.menu = menu;
  this.items = [];

  for (let i = 0; i < this.ItemCount; i++)
    this.items.push(new ProductionItem(rowIndex, i, color));
}

ProductionRow.prototype.update = function(entities) {
  for (let itemIndex = 0; itemIndex < this.ItemCount; itemIndex++) {
    let item = this.items[itemIndex];

    if (itemIndex < entities.length) {
      item.update(entities[itemIndex]);
    } else {
      item.hide();
    }
  }
}

ProductionRow.prototype.ItemCount = 20;
ProductionRow.prototype.Height = ProductionItem.prototype.ButtonWidth + ProductionItem.prototype.ProgressBarHeight + 9;
ProductionRow.prototype.VerticalGap = 8;
ProductionRow.prototype.MaxWidth = "50%";
