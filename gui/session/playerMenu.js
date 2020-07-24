function PlayerMenu () {
  this.createMenu();
}

function ProductionItem(playerIndex, itemIndex, color) {
  this.itemIndex = itemIndex;
  this.icon = Engine.GetGUIObjectByName(`productionRow[${playerIndex}]Item[${itemIndex}]Icon`);
  this.btn = Engine.GetGUIObjectByName(`productionRow[${playerIndex}]Item[${itemIndex}]Btn`);
  this.cnt = Engine.GetGUIObjectByName(`productionRow[${playerIndex}]Item[${itemIndex}]Count`);
  this.progress = Engine.GetGUIObjectByName(`productionRow[${playerIndex}]Item[${itemIndex}]Prg`);
  this.progress.sprite = brightenedSprite(color, this.ProgressBarBrighteningFactor);

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

ProductionItem.prototype.LeftMargin = 10;
ProductionItem.prototype.HorizontalGap = 2;
ProductionItem.prototype.ButtonWidth = 34;
ProductionItem.prototype.BorderWidth = 3;
ProductionItem.prototype.ProgressBarHeight = 3;
ProductionItem.prototype.PortraitDirectory = "stretched:session/portraits/";
ProductionItem.prototype.ProgressBarBrighteningFactor = 100;

function ProductionRow(playerId, color, rowIndex = playerId - 1) {
  let menu = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]`);
  let ind = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]Ind`);
  let sizeTop = rowIndex * this.Height + this.VerticalGap;
  menu.size = `0 ${sizeTop} ${this.MaxWidth} ${sizeTop + this.Height}`;
  menu.hidden = false;
  const colorSprite = `color: ${color.r * 255} ${color.g * 255} ${color.b * 255} 255`;
  ind.sprite = colorSprite;

  this.menu = menu;
  this.items = [];

  for (let i = 0; i < this.ItemCount; i++)
    this.items.push(new ProductionItem(playerId - 1, i, color));
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

PlayerMenu.prototype = (function () {
  let lastCheck = Date.now();
  let players = [];

  const tickMillis = 500;

  return {
    constructor: PlayerMenu,

    tooEarly: function () {
      const now = Date.now();

      return !(now - lastCheck > tickMillis && (lastCheck = now));
    },

    createMenu: function () {
      const matchState = Engine.GuiInterfaceCall('GetSimulationState');
      const isObserver = isPlayerObserver(g_ViewedPlayer);

      players = isObserver ?
        Array(matchState.players.length - 1).fill(0).map((_x, i) => i + 1)
        : [g_ViewedPlayer];

      this.playerMenus = {};
      for (let playerId of players) {
        const position = isObserver ? playerId - 1 : 0;

        this.playerMenus[playerId] = new ProductionRow(playerId, matchState.players[playerId].color, position);
      }

      const productionContainer = Engine.GetGUIObjectByName('productionContainer');

      if (players.length > 1) {
        const size = productionContainer.size;
        size.top = 420;
        productionContainer.size = size;
      }

      productionContainer.hidden = false;
    },

    update: function () {
      if (Engine.IsPaused() || this.tooEarly())
        return;

      //const first = Engine.GetMicroseconds();

      if (players.length == 1 && isPlayerObserver(players[0]))
        this.createMenu();

      let queues = {};
      for (let playerId of players) {
        queues[playerId] = [];
      }

      const entities = Engine.GuiInterfaceCall("prodmod_GetPlayersProduction", players.length == 1 ? players[0] : null);

      //pp("ents: " + ((Engine.GetMicroseconds() - first) / 1000).toFixed(6) + "ms.\n");

      //pp(entities);
      for (let entity of entities) {
        //pp(players);
        queues[entity.state.player].push(entity.state);
      }

      for (let playerId of players) {
        this.playerMenus[playerId].update(queues[playerId]);
      }

      //pp("gui: " + ((Engine.GetMicroseconds() - first) / 1000).toFixed(6) + "ms.\n");
      //pp("!!!");
    }
  };
})();
