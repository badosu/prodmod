function ProductionMonitor(viewedPlayer, active = true, mode = 0) {
  this.container = Engine.GetGUIObjectByName('productionMonitor');
  this.title = Engine.GetGUIObjectByName('productionMonitorTitle');
  this.titleContainer = Engine.GetGUIObjectByName('productionMonitorTitleContainer');
  this.templateCache = {};
  this.lastCheck = Date.now();
  this.viewedPlayer = viewedPlayer;
  this.mode = mode;
  this.active = active;
  this.rows = {};

  this.titleContainer.onPress = this.onModeToggle.bind(this);

  this.reset();
}

ProductionMonitor.prototype.reset = function(simulationState = Engine.GuiInterfaceCall('GetSimulationState')) {
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
    this.rows[playerId] = new ProductionRow(i, `${playerState.name} - ${civName}`, isObserver, playerState.color);
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

  const queues = this.Modes[this.mode].getQueues.bind(this)();

  this.updateRows(queues);
}

ProductionMonitor.prototype.updateRows = function(queues) {
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
  size.right = ProductionItem.prototype.LeftMargin + ProductionItem.prototype.ButtonWidth +
    (ProductionItem.prototype.ButtonWidth + ProductionItem.prototype.HorizontalGap) * Math.max(maxItems - 1, 0);
  this.container.size = size;
}

ProductionMonitor.prototype.hide = function() {
  this.active = false;
  this.container.hidden = true;
}

ProductionMonitor.prototype.toggleVisibility = function() {
  this.active ? this.hide() : this.show();
}

ProductionMonitor.prototype.show = function(mode = this.mode) {
  this.mode = mode;
  this.active = true;

  const size = this.container.size;
  size.top = this.singlePlayer() ? this.TopSingle : this.Top;
  size.bottom = this.TitleHeight + ProductionRow.prototype.MarginTop + this.players.length * (
    ProductionRow.prototype.VerticalGap + ProductionRow.prototype.Height
  ) + size.top;
  this.container.size = size;

  if (!this.singlePlayer()) {
    this.title.caption = this.Modes[this.mode].label;
    this.titleContainer.tooltip = this.Modes[this.mode].tooltip;
    this.titleContainer.hidden = false;
  }

  this.container.hidden = false;
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
  2: {
    'getQueues': function() {
      return Engine.GuiInterfaceCall("prodmod_GetResearchedTechs", this.players);
    },
    'label': 'Tech',
    'tooltip': 'Switch to Units view'
  },
  1: {
    'getQueues': function() {
      const playerStates = this.simulationState.players;

      let queues = {};
      for (let playerId of this.players) {
        queues[playerId] = [];
      }

      const playerQuery = this.singlePlayer() ? this.players[0] : -1;
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
    },
    'label': 'Production',
    'tooltip': 'Switch to Units view'
  },
  0: {
    'getQueues': function() {
      const playerStates = this.simulationState.players;

      let queues = {};

      for (let playerId of this.players) {
        const playerState = playerStates[playerId];
        const unitCounts = playerState["typeCountsByClass"]["Unit"];

        let queue = [];
        const templates = Object.keys(unitCounts);
        const positions = Engine.GuiInterfaceCall('prodmod_GetTemplatePositions', [playerId, templates]);

        // Group duplicate templates
        // e.g. units/cart_mechanical_siege_ballista_packed, units/cart_mechanical_siege_ballista_unpacked
        // resource|gaia/fauna_goat_trainable, gaia/fauna_goat_trainable
        for (let kind in unitCounts) {
          let newTemplate;

          if (kind.endsWith('_unpacked')) {
            const segments = kind.split('_');
            const templateRoot = segments.slice(0, segments.length - 1).join('_')
            newTemplate = templateRoot + '_packed';
          } else if (kind.startsWith('resource|')) {
            newTemplate = kind.slice('9');
          } else {
            continue;
          }

          unitCounts[newTemplate] = (unitCounts[newTemplate] || 0) + unitCounts[kind];
          delete unitCounts[kind];
        }

        for (let kind in unitCounts) {
          if (!unitCounts[kind])
            continue;

          const template = this.getTemplateData(kind);

          let item = {
            "count": unitCounts[kind],
            "playerName": playerState.name,
            "template": {
              "name": template.name.generic,
              "icon": template.icon
            },
            "position": positions[templates.indexOf(kind)]
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

  let tooltip = "";

  if (item.playerName)
    tooltip = item.playerName.split(' ')[0] + ' - ';

  if (item.rank && item.rank !== "Basic")
    tooltip += translateWithContext("Rank", item.rank) + ' ';

  tooltip += item.template.name;
  if (item.timeRemaining && (!item.foundation || item.timeRemaining > 0))
    tooltip += `: ${Math.ceil(item.timeRemaining)}s`

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

function ProductionRow(rowIndex, tooltip, displayLabel, color = { r: 255, g: 255, b: 255 }) {
  let row = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]`);
  let ind = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]Ind`);
  let sizeTop = rowIndex * (this.Height + this.VerticalGap) + this.MarginTop;
  if (displayLabel)
    sizeTop += ProductionMonitor.prototype.TitleHeight;

  row.size = `0 ${sizeTop} ${this.MaxWidth} ${sizeTop + this.Height}`;
  row.hidden = false;
  const colorSprite = `color: ${color.r * 255} ${color.g * 255} ${color.b * 255} 255`;

  ind.sprite = colorSprite;
  ind.tooltip = tooltip;

  this.items = [];
  this.row = row;

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

ProductionRow.prototype.hide = function() {
  this.row.hidden = true;
};

ProductionRow.prototype.ItemCount = 20;
ProductionRow.prototype.Height = ProductionItem.prototype.ButtonWidth + ProductionItem.prototype.ProgressBarHeight;
ProductionRow.prototype.VerticalGap = 0;
ProductionRow.prototype.MarginTop = 6;
ProductionRow.prototype.MaxWidth = "50%";
