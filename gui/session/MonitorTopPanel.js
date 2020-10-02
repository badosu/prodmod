function MonitorTopPanel () {
  this.createMenu();
}

MonitorTopPanel.prototype = (function () {
  let playerMenuItems =  ['wood', 'food', 'metal', 'stone', 'military', 'population', 'player'];
  let statesCache = {};
  let allPlayerStats = [];
  let menuIcons = {
    'wood':       'stretched:session/icons/resources/wood.png',
    'food':       'stretched:session/icons/resources/food.png',
    'metal':      'stretched:session/icons/resources/metal.png',
    'stone':      'stretched:session/icons/resources/stone.png',
    'population': 'stretched:session/icons/resources/population.png',
    'military':   'stretched:session/icons/stances/violent.png',
    'village':    'stretched:session/portraits/technologies/village_phase.png',
    'town':       'stretched:session/portraits/technologies/town_phase.png',
    'city':       'stretched:session/portraits/technologies/city_phase.png',
    'imperial':   'stretched:session/portraits/technologies/imperial_phase.png'
  };
  let defaultOffset = 9.6;
  let civData = loadCivFiles(false);
  translateObjectKeys(civData, ['Name']);
  civData = deepfreeze(civData);

  let lastCheck = Date.now();

  return {
    constructor: MonitorTopPanel,

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

        playerStats.menu = Engine.GetGUIObjectByName(`MonitorTopPanelRow[${player}]`);
        playerStats.menu.sprite = `color: ${playerColor(playerData)} 200`;
        playerStats.menu.size = `${leftSide ? 0 : '100%'} ${player * statsHeight} ` +
          `${leftSide ? '100%' : '80%'} ${(player * statsHeight) + statsHeight}`; // 40% -> 100%

        for (let item of playerMenuItems) {
          let playerMenuItem = {
            block:    Engine.GetGUIObjectByName((partialName = `MonitorTopPanelRow[${player}]Item[${itemIndex}]`)),
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
          }

          playerStats[item] = playerMenuItem;
          ++itemIndex;
        }

        playerStats.menu.hidden = false;
        allPlayerStats.push(playerStats);
      }

      Engine.GetGUIObjectByName('MonitorTopPanel').hidden = false;
    },

    update: function () {
      if (Engine.IsPaused() || this.tooEarly())
        return;

      const matchState = Engine.GuiInterfaceCall('GetExtendedSimulationState');

      for (let index = 0; index < allPlayerStats.length; ++index) {
        let playerStats = allPlayerStats[index];
        let singlePlayerData = matchState.players[index + 1];

        playerStats.player.icon.sprite = menuIcons[singlePlayerData.phase];

        for (let item of playerMenuItems) {
          if (singlePlayerData.resourceCounts[item] !== undefined) {
            playerStats[item].title.caption = Math.ceil(singlePlayerData.resourceCounts[item] || 0);
          } else if (item === 'population') {
            playerStats.population.title.caption = `${singlePlayerData.popCount}/${singlePlayerData.popLimit}`;
          }
        }
      }
    },
  };
})();
