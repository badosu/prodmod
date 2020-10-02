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
        row.label = Engine.GetGUIObjectByName(`MonitorTopPanelRow[${playerIndex}]PopLbl`);
        row.label.caption = playerState.military + '/' + playerState.popCount + '/' + playerState.popLimit;
        row.name.caption = playerState.name;
        row.name.textcolor = playerState.brightenedColor;
        row.phase = Engine.GetGUIObjectByName(`MonitorTopPanelRow[${playerIndex}]Phase`);
        row.phase.sprite = 'stretched:session/portraits/technologies/' + playerState.phase + '_phase.png';
        row.kd = Engine.GetGUIObjectByName(`MonitorTopPanelRow[${playerIndex}]Kd`);
        row.kd.caption = playerState.enemyUnitsKilled + ' - ' + playerState.kd;
        row.menubg = Engine.GetGUIObjectByName(`MonitorTopPanelRow[${playerIndex}]Bg`);
        row.menubg.sprite = playerState.darkenedSprite;
        row.menu.size = `0 ${playerIndex * statsHeight} 100% ${(playerIndex + 1) * statsHeight - 4}`;

        let itemIndex = 0;
        for (let resType of resTypes) {
          const partialName = `MonitorTopPanelRow[${playerIndex}]Item[${itemIndex}]`;

          let item = {
            count:    Engine.GetGUIObjectByName(`${partialName}Count`),
            rate:    Engine.GetGUIObjectByName(`${partialName}Rate`),
            icon:     Engine.GetGUIObjectByName(`${partialName}Icon`)
          };

          let iconSize = item.icon.size;
          let countSize = item.count.size;
          let rateSize = item.rate.size;

          iconSize.left = 126 + itemIndex * (24 + 29 + 32 + 5);
          iconSize.right = iconSize.left + 24;
          countSize.left = iconSize.right - 4;
          countSize.right = countSize.left + 33;
          rateSize.left = countSize.right + 3;
          rateSize.right = rateSize.left + 32;

          item.icon.size = iconSize;
          item.count.size = countSize;
          item.rate.size = rateSize;

          item.count.caption = playerState.stats[resType].count;
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
    },

    update: function () {
      let index = 0;
      for (let playerId in g_monitor_Manager.playerStates) {
        let row = rows[index];
        let playerState = g_monitor_Manager.playerStates[playerId];

        for (let resType of resTypes) {
          row[resType].count.caption = playerState.stats[resType].count;
          row[resType].rate.caption = '+' + playerState.stats[resType].rate;
        }

        row.kd.caption = playerState.enemyUnitsKilled + ' - ' + playerState.kd;
        row.label.caption = playerState.military + '/' + playerState.popCount + '/' + playerState.popLimit;
        row.phase.sprite = 'stretched:session/portraits/technologies/' + playerState.phase + '_phase.png';

        index++;
      }
    },
  };
})();
