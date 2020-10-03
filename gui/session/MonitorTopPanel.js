function MonitorTopPanel () {
  this.createMenu();
}

MonitorTopPanel.prototype = (function () {
  let resTypes =  ['food', 'wood', 'stone', 'metal'];
  let rows = [];

  return {
    constructor: MonitorTopPanel,

    createMenu: function () {
      var statsHeight = 28;

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
        row.menu.size = `0 ${playerIndex * statsHeight} 100% ${(playerIndex + 1) * statsHeight - 4}`;

        let itemIndex = 0;
        for (let resType of resTypes) {
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
        rows.push(row);
        playerIndex++;
      }

      const panel = Engine.GetGUIObjectByName('MonitorTopPanel');
      let panelSize = panel.size;
      panelSize.right = rows[0].kd.size.right;
      panelSize.bottom = rows[playerIndex - 1].menu.size.bottom + 10;
      panel.size = panelSize;
      panel.hidden = false;

      this.update();
    },

    update: function () {
      let index = 0;
      for (let playerId in g_monitor_Manager.playerStates) {
        let row = rows[index];
        let playerState = g_monitor_Manager.playerStates[playerId];

        for (let resType of resTypes) {
          row[resType].count.caption = playerState.stats[resType].count;
          row[resType].rate.caption = '+' + playerState.stats[resType].rate;

          let tooltip = '[font="' + g_ResourceTitleFont + '"]' + resourceNameFirstWord(resType) + '[/font]';
          tooltip += "\n" + resourceNameFirstWord(resType) + " amount (+ Amount/10s)";

          if (g_monitor_Manager.singlePlayer())
            tooltip += getAllyStatTooltip(resType, g_monitor_Manager.viewablePlayerStates, -1);

          row[resType].item.tooltip = tooltip;
        }

        row.kdlbl.caption = (playerState.enemyUnitsKilled == 0 && playerState.kd == 0) ? '-' : playerState.enemyUnitsKilled + ' - ' + playerState.kd;
        row.kd.tooltip = '[font="' + g_ResourceTitleFont + '"]K/D[/font]\nKilled Units - K/D';

        let popCaption = playerState.military + '/' + playerState.popCount + '/';
        popCaption += fontColor(playerState.popLimit, playerState.trainingBlocked && Date.now() % 1000 < 500 ? g_PopulationAlertColor : g_DefaultPopulationColor);
        row.poplabel.caption = popCaption;

        let tooltip = '[font="' + g_ResourceTitleFont + '"]Population[/font]\nMilitary / Population / Limit';
        if (g_monitor_Manager.singlePlayer())
          tooltip += getAllyStatTooltip('pop', g_monitor_Manager.viewablePlayerStates, -1);
        row.pop.tooltip = tooltip;

        row.phase.sprite = 'stretched:session/portraits/technologies/' + playerState.phase + '_phase.png';

        index++;
      }
    },
  };
})();

MonitorTopPanel.prototype.updateLayout = function () {
  const isPlayer = g_ViewedPlayer > 0;

  let viewPlayer = Engine.GetGUIObjectByName("viewPlayer");
  viewPlayer.hidden = !g_IsObserver && !g_DevSettings.changePerspective;

  Engine.GetGUIObjectByName("diplomacyButton").hidden = !isPlayer;
  Engine.GetGUIObjectByName("tradeButton").hidden = !isPlayer;
  Engine.GetGUIObjectByName("optionFollowPlayer").hidden = !isPlayer;
  let topPanelWidth = isPlayer ? 508 : 430;

  Engine.GetGUIObjectByName("topPanel").size = "100%-" + topPanelWidth.toString() + " 0 100%+3 36";//"-3 0 100%+3 36"
  Engine.GetGUIObjectByName("tradeButton").size = "100%-503 4 100%-475 32";//"100%-224 4 100%-196 32"
  Engine.GetGUIObjectByName("diplomacyButton").size = "100%-475 4 100%-447 32";//"100%-254 4 100%-226 32"
  Engine.GetGUIObjectByName("optionFollowPlayer").size = "100%-447 4 100%-427 100%"; //"50%+54 4 50%+256 100%"
  Engine.GetGUIObjectByName("viewPlayer").size = "100%-424 5 100%-224 100%-5";//"85%-279 5 100%-293 100%-5"
  Engine.GetGUIObjectByName("gameSpeedButton").size = "100%-222 4 100%-194 32";//"100%-284 4 100%-256 32"

  Engine.GetGUIObjectByName("pauseButton").enabled = !g_IsObserver || !g_IsNetworked || g_IsController;
  Engine.GetGUIObjectByName("menuResignButton").enabled = !g_IsObserver;
  Engine.GetGUIObjectByName("lobbyButton").enabled = Engine.HasXmppClient();

  Engine.GetGUIObjectByName("observerText").hidden = true;
  Engine.GetGUIObjectByName("followPlayerLabel").hidden = true;
  Engine.GetGUIObjectByName("population").hidden = true;
  Engine.GetGUIObjectByName("resourceCounts").hidden = true;
  Engine.GetGUIObjectByName("civIcon").hidden = true;
  Engine.GetGUIObjectByName("alphaLabel").hidden = true;
};
