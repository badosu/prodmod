function MonitorTopPanel() {
  this.container = Engine.GetGUIObjectByName('MonitorTopPanel');
  this.entityPanel = Engine.GetGUIObjectByName("panelEntityPanel");
  this.showRelicsHero = Engine.ConfigDB_GetValue("user", "monitor.topPanel.showRelicsHero") == "true";
  this.rows = [];

  this.reset();
  this.update();
}

MonitorTopPanel.prototype.ResTypes = ['food', 'wood', 'stone', 'metal'];
MonitorTopPanel.prototype.StatsHeight = 28;

MonitorTopPanel.prototype.reset = function () {
  for (let row of this.rows)
    row.menu.hidden = true;

  this.rows = [];
  let playerIndex = 0;

  for (let playerId in g_monitor_Manager.playerStates) {
    let playerState = g_monitor_Manager.playerStates[playerId];

    let row = { res: {} }

    row.menu = Engine.GetGUIObjectByName(`MonitorTopPanelRow[${playerIndex}]`);
    row.name = Engine.GetGUIObjectByName(`MonitorTopPanelRow[${playerIndex}]Name`);
    row.pop = Engine.GetGUIObjectByName(`MonitorTopPanelRow[${playerIndex}]Pop`);
    row.poplabel = Engine.GetGUIObjectByName(`MonitorTopPanelRow[${playerIndex}]PopLbl`);
    row.name.caption = playerState.name;
    row.name.textcolor = playerState.brightenedColor;
    row.phase = Engine.GetGUIObjectByName(`MonitorTopPanelRow[${playerIndex}]Phase`);
    row.kd = Engine.GetGUIObjectByName(`MonitorTopPanelRow[${playerIndex}]Kd`);
    row.kdlbl = Engine.GetGUIObjectByName(`MonitorTopPanelRow[${playerIndex}]KdLbl`);
    row.menubg = Engine.GetGUIObjectByName(`MonitorTopPanelRow[${playerIndex}]Bg`);
    row.menubg.sprite = playerState.darkenedSprite;
    row.menu.size = `0 ${playerIndex * this.StatsHeight} 100% ${(playerIndex + 1) * this.StatsHeight - 4}`;

    let itemIndex = 0;
    for (let resType of this.ResTypes) {
      const partialName = `MonitorTopPanelRow[${playerIndex}]Item[${itemIndex}]`;

      let item = {
        count:    Engine.GetGUIObjectByName(`${partialName}Count`),
        rate:     Engine.GetGUIObjectByName(`${partialName}Rate`),
        icon:     Engine.GetGUIObjectByName(`${partialName}Icon`),
        item:     Engine.GetGUIObjectByName(partialName)
      };

      let iconSize = item.icon.size;
      let countSize = item.count.size;
      let rateSize = item.rate.size;
      let itemSize = item.item.size;

      itemSize.left = 126 + itemIndex * (24 + 33 + 28 + 3);
      iconSize.right = iconSize.left + 24;
      countSize.left = iconSize.right - 7;
      countSize.right = countSize.left + 40;
      rateSize.left = countSize.right - 2;
      rateSize.right = rateSize.left + 34;
      itemSize.right = itemSize.left + rateSize.right;

      item.item.size = itemSize;
      item.icon.size = iconSize;
      item.count.size = countSize;
      item.rate.size = rateSize;
      item.icon.sprite = 'stretched:session/icons/resources/'+ resType + '.png';

      row[resType] = item;
      ++itemIndex;
    }

    row.menu.hidden = false;
    this.rows.push(row);
    playerIndex++;
  }

  let panelSize = this.container.size;
  panelSize.right = this.rows[0].kd.size.right;
  panelSize.bottom = this.rows[playerIndex - 1].menu.size.bottom;
  this.container.size = panelSize;
  this.container.hidden = false;

  if (!this.showRelicsHero)
    this.entityPanel.hidden = true;
  else if (this.container) {
    let entSize = this.entityPanel.size;
    entSize.top = this.container.size.bottom + 4;
    entSize.bottom = this.entityPanel.size.top + 60;
    this.entityPanel.size = entSize;
  }
};

MonitorTopPanel.prototype.update = function () {
  let index = 0;
  let isBlink = Date.now() % 1000 < 500;

  for (let playerId in g_monitor_Manager.playerStates) {
    let row = this.rows[index];

    if (!row) continue;

    let playerState = g_monitor_Manager.playerStates[playerId];

    for (let resType of this.ResTypes) {
      row[resType].count.caption = playerState.stats[resType].count;
      row[resType].rate.caption = fontColor('+' + playerState.stats[resType].rate, colorStat(resType, playerState.stats[resType].rate));

      let tooltip = '[font="' + g_ResourceTitleFont + '"]' + resourceNameFirstWord(resType) + '[/font]';
      tooltip += "\n" + resourceNameFirstWord(resType) + " amount (+ Amount/10s)";

      if (g_monitor_Manager.singlePlayer())
        tooltip += getAllyStatTooltip(resType, g_monitor_Manager.viewablePlayerStates, -1);

      row[resType].item.tooltip = tooltip;
    }

    let killed = colorizeStat('enemyUnitsKilled', playerState.enemyUnitsKilled);
    let kd = playerState.kd;
    let kdlbl = ''
    if (!isNaN(kd))
      kdlbl = isFinite(kd) ? fontColor(kd.toFixed(1), colorStat('kd', kd)) : fontColor('∞', '153 153 255');
      kdlbl = `${killed} ${kdlbl}`;
    row.kdlbl.caption = kdlbl;
    let kdtooltip = '[font="' + g_ResourceTitleFont + '"]K/D[/font]\nKilled Units - K/D';

    if (!g_IsObserver) {
      for (let playerID in g_monitor_Manager.viewablePlayerStates) {
        if (playerID == g_monitor_Manager.viewedPlayer) continue;

        const playerState = g_monitor_Manager.viewablePlayerStates[playerID];

        const sequences = playerState.sequences;
        const lastIndex = sequences.time.length - 1;
        const unitsLost = sequences.unitsLost.total[lastIndex];
        const enemyUnitsKilled = sequences.enemyUnitsKilled.total[lastIndex];

        kd = enemyUnitsKilled / unitsLost;
        kdtooltip += `\n${colorizePlayernameHelper("■", playerID) + " " + playerState.name}: `;

        kdlbl = ''
        if (!isNaN(kd))
          kdlbl = ` - ${isFinite(kd) ? kd.toFixed(1) : '∞'}`;

        kdtooltip += `${enemyUnitsKilled}/${unitsLost}${kdlbl}`;
      }
    }

    row.kd.tooltip = kdtooltip;

    row.poplabel.caption = headerFont(colorizeStat('popCount', playerState.popCount)) + '/' +
      fontColor(playerState.popLimit, playerState.trainingBlocked && isBlink ? g_PopulationAlertColor : g_DefaultPopulationColor) +
      '/' + colorizeStat('military', playerState.military);

    let tooltip = '[font="' + g_ResourceTitleFont + '"]Population[/font]\nPopulation / Limit / Military';
    if (g_monitor_Manager.singlePlayer())
      tooltip += getAllyStatTooltip('pop', g_monitor_Manager.viewablePlayerStates, -1);
    row.pop.tooltip = tooltip;

    row.phase.sprite = 'stretched:session/portraits/technologies/' + playerState.phase + '_phase.png';

    index++;
  }
};

MonitorTopPanel.prototype.updateLayout = function () {
  const isPlayer = g_ViewedPlayer > 0;

  let viewPlayer = Engine.GetGUIObjectByName("viewPlayer");
  let diplomacy = Engine.GetGUIObjectByName("diplomacyButton")
  let trade = Engine.GetGUIObjectByName("tradeButton");
  let optionFollowPlayer = Engine.GetGUIObjectByName("optionFollowPlayer");
  let gameSpeed = Engine.GetGUIObjectByName("gameSpeedButton");
  let objectives = Engine.GetGUIObjectByName("objectivesButton");

  viewPlayer.hidden = !g_IsObserver && !g_DevSettings.changePerspective;
  diplomacy.hidden = !isPlayer;
  trade.hidden = !isPlayer;
  optionFollowPlayer.hidden = !(g_IsObserver && isPlayer);

  let sizes = [[optionFollowPlayer, 22], [trade, 28], [diplomacy, 28], [objectives, 28], [gameSpeed, 28], [viewPlayer, 200]];
  let remainingWidth = sizes.reduce((v, c) => v + (c[0].hidden ? 0 : c[1]), 0) + 164;

  Engine.GetGUIObjectByName("topPanel").size = "100%-" + remainingWidth + " 0 100%+3 36";//"-3 0 100%+3 36"

  for (let els of sizes) {
    let [el, size] = els;

    if (el.hidden) continue;

    let nextWidth = remainingWidth - size;
    el.size = `100%-${remainingWidth} 4 100%-${nextWidth} 32`;
    remainingWidth = nextWidth;
  }

  Engine.GetGUIObjectByName("pauseButton").enabled = !g_IsObserver || !g_IsNetworked || g_IsController;
  Engine.GetGUIObjectByName("menuResignButton").enabled = !g_IsObserver;
  Engine.GetGUIObjectByName("lobbyButton").enabled = Engine.HasXmppClient();

  Engine.GetGUIObjectByName("observerText").hidden = true;
  Engine.GetGUIObjectByName("followPlayerLabel").hidden = true;
  Engine.GetGUIObjectByName("population").hidden = true;
  Engine.GetGUIObjectByName("resourceCounts").hidden = true;
  Engine.GetGUIObjectByName("civIcon").hidden = true;
  Engine.GetGUIObjectByName("alphaLabel").hidden = true;

  let chatPanel = Engine.GetGUIObjectByName("chatPanel");
  chatPanel.size = `0 70% 50%-509 100%-10`;
};
