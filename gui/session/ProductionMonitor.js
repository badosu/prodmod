function ProductionMonitor(viewedPlayer, active = true, mode = 0) {
  this.container = Engine.GetGUIObjectByName('productionMonitor');
  this.title = Engine.GetGUIObjectByName('productionMonitorTitle');
  this.titleContainer = Engine.GetGUIObjectByName('productionMonitorTitleContainer');
  this.templateCache = {};
  this.lastCheck = Date.now();
  this.viewedPlayer = viewedPlayer;
  this.mode = mode;
  this.active = active;

  this.titleContainer.onPress = this.onModeToggle.bind(this);

  this.reset();
}

ProductionMonitor.prototype.reset = function(simulationState = Engine.GuiInterfaceCall('GetSimulationState')) {
  this.simulationState = simulationState;
  const playerStates = simulationState.players;
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

  if (this.active)
    this.show();
}

ProductionMonitor.prototype.onModeToggle = function() {
  this.mode++;
  this.mode %= Object.keys(this.Modes).length;

  this.show();
  this.update(true);
}

ProductionMonitor.prototype.getTemplateData = function(templateName) {
  if (!this.templateCache[templateName])
    this.templateCache[templateName] = GetTemplateData(templateName);

  return this.templateCache[templateName];
}

ProductionMonitor.prototype.update = function(forceRender = false) {
  if (!this.active || (Engine.IsPaused() || (!forceRender && this.tooEarly())))
    return;

  this.simulationState = Engine.GuiInterfaceCall('GetSimulationState')
  const playerStates = this.simulationState.players;
  const isObserver = !playerStates[this.viewedPlayer] || playerStates[this.viewedPlayer].state != "active";

  // Switch to overview when user was a player and is defeated or wins
  // TODO: Use a24 registerPlayersFinishedHandler
  if (this.singlePlayer() && isObserver)
    this.reset(this.simulationState);

  const queues = this.Modes[this.mode].getQueues.bind(this)();

  this.updateRows(queues);
}

ProductionMonitor.prototype.updateRows = function(queues) {
  for (let playerId of this.players) {
    this.rows[playerId].update(queues[playerId]);
  }
}

ProductionMonitor.prototype.hide = function() {
  this.active = false;
  this.container.hidden = true;
}

ProductionMonitor.prototype.toggleVisibility = function() {
  if (this.active) {
    this.hide();
  } else {
    this.show();
  }
}

ProductionMonitor.prototype.show = function(mode = this.mode) {
  this.mode = mode;
  this.active = true;

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
ProductionMonitor.prototype.Ranks = { 'a': 'Advanced', 'b': 'Basic', 'e': 'Elite' };
ProductionMonitor.prototype.Modes = {
  //2: {
  //  'getQueues': function() {
  //    let queues = {};
  //    for (let playerId of this.players) {
  //      queues[playerId] = [];
  //      pp(Engine.GuiInterfaceCall("prodmod_GetResearchedTechs", playerId));
  //    }
  //    //playerIdconst playerQuery = this.singlePlayer() ? this.players[0] : -1;
  //    //playerIdconst entityStates = Engine.GuiInterfaceCall("prodmod_GetPlayersProduction", playerQuery);
  //    //playerIdfor (let entityState of entityStates.map(e => e.state)) {
  //    //playerId  queues[entityState.player].push(entityState);
  //    //playerId}

  //    return queues;
  //  },
  //  'label': 'Tech',
  //  'tooltip': 'Switch to Units view'
  //},
  1: {
    'getQueues': function() {
      let queues = {};
      for (let playerId of this.players) {
        queues[playerId] = [];
      }

      const playerQuery = this.singlePlayer() ? this.players[0] : -1;
      const entityStates = Engine.GuiInterfaceCall("prodmod_GetPlayersProduction", playerQuery);
      for (let entityState of entityStates.map(e => e.state)) {
        queues[entityState.player].push(entityState);
      }

      return queues;
    },
    'label': 'Production',
    'tooltip': 'Switch to Units view'
  },
  0: {
    'getQueues': function() {
      const playerStates = this.simulationState.players;

      let queues = {};

      for (let playerId of this.players) {
        const unitCounts = playerStates[playerId]["typeCountsByClass"]["Unit"];

        let queue = [];
        for (let kind in unitCounts) {
          const template = this.getTemplateData(kind);

          let item = {
            "count": unitCounts[kind],
            "template": {
              "name": template.name.generic,
              "icon": template.icon
            }
          };

          const segments = kind.split('_');
          const rank = this.Ranks[segments[segments.length - 1]];
          if (rank)
            item['rank'] = rank;

          queue.push(item);
        }

        queues[playerId] = queue;
      }

      return queues;
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
  this.rank = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]Item[${itemIndex}]Rank`);
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
  if (item.rank && item.rank !== "Basic")
    tooltip = `${translateWithContext("Rank", item.rank)} ${tooltip}`;
  if (item.timeRemaining && (!item.foundation || item.timeRemaining > 0))
    tooltip += " - " + Math.ceil(item.timeRemaining) + "s"

  this.btn.tooltip = tooltip;
  this.btn.hidden = false;

  if (item.count) {
    this.cnt.caption = item.count;
  } else if (item.production && item.production.kind == "unit") {
    this.cnt.caption = item.production.count;
  } else {
    this.cnt.caption = "";
  }

  if (item.rank && item.rank !== "Basic") {
    this.rank.sprite = this.RankDirectory + item.rank + ".png";
    this.rank.hidden = false;
  } else {
    this.rank.hidden = true;
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
ProductionItem.prototype.RankDirectory = "stretched:session/icons/ranks/";

function ProductionRow(rowIndex, displayLabel, color = { r: 255, g: 255, b: 255 }) {
  let row = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]`);
  let ind = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]Ind`);
  let sizeTop = rowIndex * (this.Height + this.VerticalGap) + this.MarginTop;
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
ProductionRow.prototype.Height = ProductionItem.prototype.ButtonWidth + ProductionItem.prototype.ProgressBarHeight;
ProductionRow.prototype.VerticalGap = 2;
ProductionRow.prototype.MarginTop = 6;
ProductionRow.prototype.MaxWidth = "50%";
