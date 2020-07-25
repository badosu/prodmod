function ProductionMonitor(viewedPlayer) {
  this.container = Engine.GetGUIObjectByName('productionMonitor');
  this.title = Engine.GetGUIObjectByName('productionMonitorTitle');
  this.titleContainer = Engine.GetGUIObjectByName('productionMonitorTitleContainer');
  this.lastCheck = Date.now();
  this.viewedPlayer = viewedPlayer;
  this.mode = 0;

  this.titleContainer.onPress = this.onModeToggle.bind(this);

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

ProductionMonitor.prototype.onModeToggle = function() {
  this.mode++;
  this.mode %= Object.keys(this.Modes).length;

  this.show();
  this.update(true);
}

ProductionMonitor.prototype.update = function(forceRender = false) {
  if (Engine.IsPaused() || (!forceRender && this.tooEarly()))
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

  //pp("reset: " + ((Engine.GetMicroseconds() - first) / 1000).toFixed(6) + "ms.\n");

  let entityStates = this.Modes[this.mode].retrieve(this.singlePlayer() ? this.players[0] : -1);

  //pp(this.Modes[this.mode].label + " retrieved: " + ((Engine.GetMicroseconds() - first) / 1000).toFixed(6) + "ms.\n");

  for (let entityState of entityStates) {
    queues[entityState.player].push(entityState);
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

  this.container.size = size;
  this.container.hidden = false;

  if (!this.singlePlayer()) {
    this.title.caption = this.Modes[this.mode].label;
    this.titleContainer.tooltip = this.Modes[this.mode].tooltip;
    this.titleContainer.hidden = false;
  }
}

ProductionMonitor.prototype.singlePlayer = function() {
  return this.players.length == 1;
}

ProductionMonitor.prototype.tooEarly = function() {
  const now = Date.now();

  return !(now - this.lastCheck > this.TickMillis && (this.lastCheck = now));
}

ProductionMonitor.prototype.TitleHeight = 20;
ProductionMonitor.prototype.TickMillis = 500;
ProductionMonitor.prototype.Top = 420;
ProductionMonitor.prototype.TopSingle = 84;
ProductionMonitor.prototype.Modes = {
  1: {
    'retrieve': (playerId) => Engine.GuiInterfaceCall("prodmod_GetPlayersProduction", playerId).map(e => e.state),
    'label': 'Production',
    'tooltip': 'Switch to Units view'
  },
  0: {
    'retrieve': function(playerId) {
      const entityStates = Engine.GuiInterfaceCall("prodmod_GetPlayersUnits", playerId);
      let counts = Object.create(null);

      for (let e of entityStates) {
        const ss = JSON.stringify(e.state);
        counts[ss] = (counts[ss] || 0) + 1;
      }

      return Object.keys(counts).map(ss => {
        const e = JSON.parse(ss);
        e.count = counts[ss].toString();

        return e;
      });
    },
    'label': 'Units',
    'tooltip': 'Switch to Production view'
  }
}

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

  if (item.count) {
    this.cnt.caption = item.count;
  } else if (item.production && item.production.kind == "unit") {
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
  let row = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]`);
  let ind = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]Ind`);
  let sizeTop = rowIndex * this.Height + this.VerticalGap;
  if (displayLabel)
    sizeTop += ProductionMonitor.prototype.TitleHeight;

  row.size = `0 ${sizeTop} ${this.MaxWidth} ${sizeTop + this.Height}`;
  row.hidden = false;
  const colorSprite = `color: ${color.r * 255} ${color.g * 255} ${color.b * 255} 255`;
  ind.sprite = colorSprite;

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
