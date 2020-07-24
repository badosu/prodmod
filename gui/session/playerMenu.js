function PlayerMenu () {
  this.createMenu();
}

function ProductionItem(playerIndex, itemIndex, sprite) {
  this.itemIndex = itemIndex;
  this.icon = Engine.GetGUIObjectByName(`productionRow[${playerIndex}]Item[${itemIndex}]Icon`);
  this.btn = Engine.GetGUIObjectByName(`productionRow[${playerIndex}]Item[${itemIndex}]Btn`);
  this.cnt = Engine.GetGUIObjectByName(`productionRow[${playerIndex}]Item[${itemIndex}]Count`);
  this.progress = Engine.GetGUIObjectByName(`productionRow[${playerIndex}]Item[${itemIndex}]Prg`);
  this.progress.sprite = sprite;

  const offset = 34;
  const buttonLeft = 8 + (offset + 2) * this.itemIndex;
  let size = this.btn.size;
  size.left = buttonLeft;
  size.right = buttonLeft + offset;
  this.btn.size = size;

  this.btn.onPress = this.onPress.bind(this);
}

ProductionItem.prototype.update = function(item) {
  this.item = item;
  this.icon.sprite = "stretched:session/portraits/" + item.template.icon;

  let btnSize = this.btn.size;
  let progressSize = this.progress.size;
  if (item.progress && (!item.foundation || item.hitpoints > 1)) {
    this.progress.hidden = false;
    btnSize.bottom = 37
    progressSize.right = 3 + 28 * item.progress;
  } else {
    this.progress.hidden = true;
    btnSize.bottom = 35
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

function brightenRgb(color, amount) {
  const threshold = 255.999;

  let r = color.r * 255;
  let g = color.g * 255;
  let b = color.b * 255;

  const total = r + g + b;

  if (total < 400) { // low enough to increase
    r += amount;
    g += amount;
    b += amount;
    const m = Math.max(r, g, b);

    if (m > threshold) {
      const total = r + g + b;
      if (total >= 3 * threshold) {
        r = g = b = threshold;
      } else {
        const x = (3 * threshold - total) / (3 * m - total);
        const gray = threshold - x * m;
        r = gray + x * r;
        g = gray + x * g;
        b = gray + x * b;
      }
    }
  }

  return `color: ${Math.floor(r)} ${Math.floor(g)} ${Math.floor(b)} 255`;
}

function ProductionRow(playerId, playerData, rowIndex = playerId - 1) {
  let height = 44;
  let menu = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]`);
  let ind = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]Ind`);
  let sizeTop = rowIndex * height + 8;
  menu.size = `0 ${sizeTop} 50% ${sizeTop + height}`;
  menu.hidden = false;
  const colorSprite = `color: ${playerData.color.r * 255} ${playerData.color.g * 255} ${playerData.color.b * 255} 255`;
  ind.sprite = colorSprite;

  this.menu = menu;
  this.items = [];
  const brightenedRgb = brightenRgb(playerData.color, 70);
  for (let i=0; i<20; i++)
    this.items.push(new ProductionItem(playerId - 1, i, brightenedRgb));
}

ProductionRow.prototype.update = function(entities) {
  for (let itemIndex=0; itemIndex < 20; itemIndex++) {
    let item = this.items[itemIndex];

    if (itemIndex < entities.length) {
      item.update(entities[itemIndex]);
    } else {
      item.hide();
    }
  }
}

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

        this.playerMenus[playerId] = new ProductionRow(playerId, matchState.players[playerId], position);
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

      const entities = Engine.GuiInterfaceCall("prodmod_GetPlayersProduction");

      //pp("ents: " + ((Engine.GetMicroseconds() - first) / 1000).toFixed(6) + "ms.\n");

      for (let entity of entities) {
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
