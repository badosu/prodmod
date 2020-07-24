function PlayerMenu () {
  this.createMenu();
}

let matchColors = {
  '21': 'Blue', '150': 'Red',    '86':  'Green',  '231': 'Yellow',
  '50': 'Cyan', '160': 'Purple', '220': 'Orange', '64':  'Gray'
};

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
  this.entityPosition = item.position;
  this.icon.sprite = "stretched:session/portraits/" + item.template.icon;

  let btnSize = this.btn.size;
  if (typeof item.progress == "number") { // js is stupid, 0 evals as false
    this.progress.hidden = false;
    btnSize.bottom = 37

    let progressSize = this.progress.size;
    progressSize.right = 3 + 28 * item.progress;
    this.progress.size = progressSize;
  } else {
    this.progress.hidden = true;
    btnSize.bottom = 35
  }
  this.btn.size = btnSize;

  let tooltip = getEntityNames(item.template);
  if (item.timeRemaining)
    tooltip += " - " + Math.ceil(item.timeRemaining) + "s"

  this.btn.tooltip = tooltip;
  this.btn.hidden = false;
  this.cnt.caption = item.caption || "";
}

ProductionItem.prototype.onPress = function() {
  if (!this.entityPosition)
    return;

  Engine.CameraMoveTo(this.entityPosition.x, this.entityPosition.z);
}

ProductionItem.prototype.hide = function() {
  this.btn.hidden = true;
  this.progress.hidden = true;
}

function ProductionRow(playerId, playerData, rowIndex = playerId - 1) {
  let height = 44;
  let menu = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]`);
  let ind = Engine.GetGUIObjectByName(`productionRow[${rowIndex}]Ind`);
  let sizeTop = rowIndex * height + 8;
  menu.size = `0 ${sizeTop} 50% ${sizeTop + height}`;
  menu.hidden = false;
  const colorSprite = `Bg${matchColors[(playerData.color.r * 255)+ '']}Dark`;
  ind.sprite = colorSprite;

  this.menu = menu;
  this.items = [];
  for (let i=0; i<20; i++)
    this.items.push(new ProductionItem(playerId - 1, i, colorSprite));
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
  const productionFilter = (e) => e.state && players.indexOf(e.state.player) > -1 && (
    (e.state.foundation && !e.state.mirage) ||
    (e.state.production && e.state.production.queue.length > 0)
  );

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
        Array(matchState.players.length - 1).fill(0).map((x, y) => y + 1)
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

    extractEntityData: function(entity) {
      const state = entity.state;
      const position = state.position;
      let caption, template, timeRemaining;
      let progress = 0;

      if (state.foundation) {
        const templateSections = state.template.split('|');
        template = GetTemplateData(templateSections[templateSections.length - 1]);
        timeRemaining = state.foundation.buildTime.timeRemaining;
        if (timeRemaining == 0)
          timeRemaining = false;
        progress = state.hitpoints > 1 ? state.hitpoints / state.maxHitpoints : false;
      } else if (state.production) {
        const batch = state.production.queue[0];
        timeRemaining = batch.timeRemaining / 1000.0;
        progress = batch.progress;

        if (batch.unitTemplate) {
          template = GetTemplateData(batch.unitTemplate);
          caption = batch.count;
        } else if (batch.technologyTemplate) {
          template = GetTechnologyData(batch.technologyTemplate, g_Players[state.player].civ);
        } else {
          pp(entity);
          return;
        }
      } else {
        pp(entity);
        return;
      }

      return { "template": template, "caption": caption, "timeRemaining": timeRemaining, "progress": progress, "position": position };
    },

    update: function () {
      if (Engine.IsPaused() || this.tooEarly())
        return;

      if (players.length == 1 && isPlayerObserver(players[0])) {
        this.createMenu();
      }

      let queues = {};
      for (let playerId of players) {
        queues[playerId] = [];
      }

      let entities = GetMultipleEntityStates(Engine.GuiInterfaceCall("GetNonGaiaEntities"));

      for (let entity of entities) {
        if (!productionFilter(entity))
          continue;

        const entityData = this.extractEntityData(entity);
        if (entityData) {
          queues[entity.state.player].push(entityData);
        }
      }

      for (let playerId of players) {
        this.playerMenus[playerId].update(queues[playerId]);
      }
    }
  };
})();
