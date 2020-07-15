function PlayerMenu () {
  this.createMenu();
}

PlayerMenu.prototype = (function () {
  let playerMenuItems =  ['wood', 'food', 'metal', 'stone', 'economics', 'military', 'population', 'player'];
  let statesCache = {};
  let allPlayerStats = [];
  let economics = {};
  let resHighlightTimeout = {};
  let matchColors = {
    '21': 'Blue', '150': 'Red',    '86':  'Green',  '231': 'Yellow',
    '50': 'Cyan', '160': 'Purple', '220': 'Orange', '64':  'Gray'
  };
  let colorTable = {
    '255 255 255 255': 'white', '255 165 0 255': 'orange'
  };
  let menuIcons = {
    'wood':       'stretched:session/icons/resources/wood.png',
    'food':       'stretched:session/icons/resources/food.png',
    'metal':      'stretched:session/icons/resources/metal.png',
    'stone':      'stretched:session/icons/resources/stone.png',
    'population': 'stretched:session/icons/resources/population.png',
    'economics':  'stretched:session/icons/economics.png',
    'military':   'stretched:session/icons/stances/violent.png',
    'village':    'stretched:session/portraits/technologies/village_phase.png',
    'town':       'stretched:session/portraits/technologies/town_phase.png',
    'city':       'stretched:session/portraits/technologies/city_phase.png',
    'imperial':   'stretched:session/portraits/technologies/imperial_phase.png'
  };
  let defaultOffset = 9.6;
//  let proportions = { population: 18 };
  let civData = loadCivFiles(false);
  translateObjectKeys(civData, ['Name']);
  civData = deepfreeze(civData);

  let lastCheck = Date.now();

  function getColor (color) {
    return colorTable[color] || color;
  };

  return {
    constructor: PlayerMenu,

    tooEarly: function () {
      return !(Date.now() - lastCheck > 1000 && (lastCheck = Date.now()));
    },

    isCacheStale: function (key, ttl) {
      if (!statesCache[key]) statesCache[key] = [];
      if (!statesCache[key][0] || (Date.now() - statesCache[key][0]) > (ttl || 1000))
        return true;

      return false;
    },

    setCache: function (key, value) {
      statesCache[key] = [Date.now(), value];
      return value;
    },

    getCache: function (key) {
      return statesCache[key][1];
    },

    getState: function (player) {
      let result;

      if (this.isCacheStale('simulation'))
        result = this.setCache('simulation', Engine.GuiInterfaceCall('GetSimulationState')); // deepfreeze
      else
        result = this.getCache('simulation');

      return player ? result[player] : result;
    },

    getEntities: function () {
      if (this.isCacheStale('entities'))
        return this.setCache('entities', GetMultipleEntityStates(Engine.GuiInterfaceCall("GetNonGaiaEntities"))); // deepfreeze

      return this.getCache('entities');
    },

    calcEconomics: function (player, stats) {
      stats = stats ? stats.resourcesGathered : this.getState(player).statistics.resourcesGathered;

      if (!economics[player])
        economics[player] = { averages: [], sumResources: [], lastTotal: 0, lastSurvey: Date.now() };

      let economic = economics[player];

      if (Date.now() - economic.lastSurvey < 990)
        return economic.averages[0] || 0;

      let total = Math.ceil(stats.wood + stats.food + stats.metal + stats.stone);
      economic.sumResources.unshift(total - economic.lastTotal);
      economic.lastTotal = total;
      economic.lastSurvey = Date.now();

      if (economic.sumResources.length > 10)
        economic.sumResources.pop();

      economic.averages.unshift(
        Math.ceil(economic.sumResources.reduce((a, b) => a + b, 0) / economic.sumResources.length) * 6
      );

      if (economic.averages.length > 10)
        economic.averages.pop();

      return economic.averages[0];
    },

    createMenu: function () {
      var matchState = this.getState();
      var showUnitsByRes = matchState.players.length < 6;
      var statsHeight = showUnitsByRes ? 33 : 26;
      let partialName;
      let leftSide = true;
      let playerData;
      let itemIndex;

      for (let player = 0; player < matchState.players.length - 1; ++player) {
        let playerStats = { res: {} }
        let blockOffset = 0;
        itemIndex = 0;
        playerData = matchState.players[player + 1];

        playerStats.menu = Engine.GetGUIObjectByName(`teamMenuPlayer[${player}]`);
        playerStats.menu.sprite = `Bg${showUnitsByRes ? '' : 'Small'}${matchColors[(playerData.color.r * 255)+ '']}Dark`;
        playerStats.menu.size = `${leftSide ? 0 : '100%'} ${player * statsHeight} ` +
          `${leftSide ? '100%' : '80%'} ${(player * statsHeight) + statsHeight}`; // 40% -> 100%

        for (let item of playerMenuItems) {
          let playerMenuItem = {
            block:    Engine.GetGUIObjectByName((partialName = `teamMenuPlayer[${player}]Item[${itemIndex}]`)),
            btn:      Engine.GetGUIObjectByName(`${partialName}Btn`),
            title:    Engine.GetGUIObjectByName(`${partialName}Title`),
            subtitle: Engine.GetGUIObjectByName(`${partialName}Subtitle`),
            icon:     Engine.GetGUIObjectByName(`${partialName}Icon`)
          };

          playerMenuItem.icon.sprite = menuIcons[item] || '';
          playerMenuItem.subtitle.caption = '0';
          playerMenuItem.block.size = (item === 'population' || item === 'military') ? `${blockOffset}% 3 ${(blockOffset += 12)}% ${statsHeight}` :
            `${blockOffset}% 3 ${(blockOffset += defaultOffset)}% ${statsHeight}`;

          if (playerData.resourceCounts[item] !== undefined) {
            playerMenuItem.title.caption = 99999; // playerData.resourceCounts[item];
          } else if (item === 'population' || item === 'military') {
            playerMenuItem.title.size = '30 3 80 19';
            playerMenuItem.subtitle.size = '30 18 80 32';
            playerMenuItem.title.caption = item === 'population' ? `${playerData.popCount}/${playerData.popLimit}` : '0/0';
          } else if (item === 'player') {
            playerMenuItem.btn.size = '0 3 16 19';
            playerMenuItem.title.size = '22 3 140 19';
            playerMenuItem.title.caption = playerData.name.replace(/ \(\d+\)/, '').substring(0, 18);
            playerMenuItem.icon.sprite = `stretched:${civData[playerData.civ].Emblem}`;
            playerMenuItem.title.onPress = selectViewPlayer.bind(this, player + 1);
          } else {
            playerMenuItem.title.caption = 0;
          }

          if (!showUnitsByRes) {
            playerMenuItem.subtitle.hidden = true;
          }

          if (player > 0) {
            if (item !== 'player')
              playerMenuItem.icon.hidden = playerMenuItem.btn.hidden = true;
          } else {
            warn( playerMenuItem.btn.size+''  );
          }

          playerStats[item] = playerMenuItem;
          ++itemIndex;
        }

        playerStats.menu.hidden = false;
        allPlayerStats.push(playerStats);
      }

      Engine.GetGUIObjectByName('teamMenu').hidden = false;
    },

    resourceHighlight: function (player, resource, color, timeoutFn) {
      if (!resHighlightTimeout[player])
        resHighlightTimeout[player] = { [resource]: { timeout: 0, default: '' } };
      if (!resHighlightTimeout[player][resource])
        resHighlightTimeout[player][resource] = { timeout: 0, default: '' };
      if (!timeoutFn && resHighlightTimeout[player][resource].timeout)
        return;

      let textcolor = allPlayerStats[player][resource].title.textcolor;

      resHighlightTimeout[player][resource].timeout =
        setTimeout(this.resourceHighlight.bind(this, player, resource, getColor(textcolor), true), 500);

      if (!color) {
        color = 'orange';
        resHighlightTimeout[player][resource].default = 'white';
      }

      allPlayerStats[player][resource].title.textcolor = getColor(color);
    },

    clearResourceHightlight: function (player, resource) {
      if (!resHighlightTimeout[player] || !resHighlightTimeout[player][resource] || !resHighlightTimeout[player][resource].timeout)
        return;

      resHighlightTimeout[player][resource].timeout = !!clearTimeout(resHighlightTimeout[player][resource].timeout);
      allPlayerStats[player][resource].title.textcolor = resHighlightTimeout[player][resource].default;
    },

    update: function () {
      if (Engine.IsPaused() || this.tooEarly())
        return;

      const unitsByRes = allPlayerStats.length < 5 ? this.unitsByResource() : [];
      const matchState = Engine.GuiInterfaceCall('GetExtendedSimulationState');
      let sequencesLastIndex = matchState.players[1].sequences.unitsLost.total.length - 1;

      for (let index = 0; index < allPlayerStats.length; ++index) {
        let playerStats = allPlayerStats[index];
        let singlePlayerData = matchState.players[index + 1];
        let killed = singlePlayerData.sequences.enemyUnitsKilled.total[sequencesLastIndex];
        let dead = singlePlayerData.sequences.unitsLost.total[sequencesLastIndex];

        playerStats.player.icon.sprite = menuIcons[singlePlayerData.phase];

        for (let item of playerMenuItems) {
          playerStats[item].subtitle.caption = unitsByRes[index + 1] ? unitsByRes[index + 1][item] || '0' : '0';

          if (singlePlayerData.resourceCounts[item] !== undefined) {
            playerStats[item].title.caption = Math.ceil(singlePlayerData.resourceCounts[item] || 0);
          } else if (item === 'population') {
            if (singlePlayerData.trainingBlocked)
              this.resourceHighlight(index, item);
            else
              this.clearResourceHightlight(index, item);

            playerStats.population.title.caption = `${singlePlayerData.popCount}/${singlePlayerData.popLimit}`;
          } else {
            playerStats[item].title.caption = item === 'economics' ? this.calcEconomics(index + 1, singlePlayerData.statistics) :
              (item === 'military' ? `${killed}/${dead}` : playerStats[item].title.caption);
          }
        }
      }
    },

    unitsByResource: function () {
      let entState;
      let entPlayer;
      let entOrder;
      let unitsByRes = {};
      let otherActions = {};
      let entStates = this.getEntities()
        .filter((ent) => ent.state && ent.state.identity && ent.state.identity.classes.indexOf('Human') > -1);

      for (let i = 0; i < entStates.length; i++) {
        entState = entStates[i].state;
        entPlayer = entState.player;

        if (!unitsByRes[entPlayer]) {
          unitsByRes[entPlayer] = { wood: 0, food: 0, stone: 0, metal: 0 };
          otherActions[entPlayer] = { };
        }

        if (!entState.unitAI.orders || !entState.unitAI.orders[0] || !entState.unitAI.orders[0].type)
          continue;

        entOrder = entState.unitAI.orders[0];

        if (entOrder.type === 'Gather') {
          if (menuIcons[entOrder.data.type.generic])
            unitsByRes[entPlayer][entOrder.data.type.generic] += 1;
        } else {
          otherActions[entPlayer][entOrder.type] = (otherActions[entPlayer][entOrder.type] || 0) + 1;
        }
      }

      return unitsByRes;
    },

    toggleQueue: function () {
      //warn(' toggle queue ');
    },

    toggleEconomics: function () {
      //warn(' toggle economics ');
    },

    toggleMilitary: function () {
      //warn(' toggle military ');
    },

    toggleGatherers: function () {
      //warn(' toggle gatherers ');
    }
  };
})();
