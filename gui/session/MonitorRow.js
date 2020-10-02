function MonitorRow(rowIndex, playerId) {
  this.playerId = playerId;
  const playerState = g_monitor_Manager.playerStates[this.playerId];

  const row = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]`);
  this.ind = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Ind`);
  const indIcon = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]IndIcon`);
  const indTeam = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]IndTeam`);
  if (!playerState.hideTeam)
    indTeam.caption = playerState.team + 1;
  indIcon.sprite = "stretched:" + g_CivData[playerState.civ].Emblem;
  this.label = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Label`);
  let sizeTop = rowIndex * (this.Height + this.VerticalGap) + this.MarginTop;
  if (g_monitor_Manager.isObserver())
    sizeTop += Monitor.prototype.TitleHeight;

  row.size = `0 ${sizeTop} 100% ${sizeTop + this.Height}`;
  row.hidden = false;

  this.ind.sprite = playerState.darkenedSprite;

  this.items = [];
  this.row = row;

  for (let i = 0; i < this.ItemCount; i++)
    this.items.push(new MonitorItem(rowIndex, i, playerState.brightenedSprite));
}

MonitorRow.prototype.update = function(entities, displayLabel) {
  const playerState = g_monitor_Manager.playerStates[this.playerId];
  const ccTemplate = playerState.hasCC;
  if (ccTemplate) {
    const ccEntity = Engine.GuiInterfaceCall('monitor_GetTemplateEntities', [playerState.id, [ccTemplate]])[0];

    if (ccEntity) {
      const moveToCC = function() {
        Engine.CameraMoveTo(ccEntity.position.x, ccEntity.position.z);
      };

      this.ind.onPress = moveToCC;
      this.label.onPress = moveToCC;
    }
  }

  let tooltip = `${formattedPlayerName(playerState)} - ${playerState.civName}\n`;
  tooltip += `${headerFont('Economy')} - Phase ${headerFont(playerState.phaseName)}\n`;

  const stats = playerState.stats;
  for (let resType in stats)
    tooltip += `${resourceIcon(resType)} ${stats[resType].count}+${fontColor(`${stats[resType].rate}/s`, 'green')}\n`;

  tooltip += `${headerFont('Military')} (${headerFont(playerState.military)})\n`;
  tooltip += `K/D: ${fontColor(playerState.enemyUnitsKilled, 'green')} ${(unitFont("("+playerState.enemyUnitsKilledValue+")"))} / ${fontColor(playerState.unitsLost, 'red')} ${(unitFont("("+playerState.unitsLostValue+")"))} - ${playerState.kd}\n`;
  tooltip += `Loot: ${fontColor(playerState.loot, 'green')}\n`;
  tooltip += `Res. Killed: ${fontColor(playerState.resKilled, 'green')}\n`;
  tooltip += `Res. Lost: ${fontColor(playerState.resLost, 'red')}\n`;

  if (playerState.totalSold)
    tooltip += `\nBarter ef.: ${Math.floor(100 * playerState.totalBought / playerState.totalSold)}%`
  if (playerState.tradeIncome)
    tooltip += `\nTrade Income: ${playerState.tradeIncome}`
  if (playerState.tributesSent)
    tooltip += `\nRes. Sent: ${fontColor(playerState.tributesSent, 'red')}`
  if (playerState.tributesReceived)
    tooltip += `\nRes. Received: ${fontColor(playerState.tributesReceived, 'green')}\n`

  this.ind.tooltip = tooltip;

  if (displayLabel) {
    let label = setStringTags(
      playerState.name.slice(0, 8),
      { "font": "mono-stroke-10", "color": playerState.brightenedColor }
    );
    const popCount = playerState.popCount;
    label += `\n${popCount}/${playerState.popLimit}`;

    this.label.tooltip = tooltip;
    this.label.caption = label;
    this.label.hidden = false;
  } else {
    this.label.hidden = true;
  }

  for (let itemIndex = 0; itemIndex < this.ItemCount; itemIndex++) {
    let item = this.items[itemIndex];

    let leftMargin = this.IndWidth;
    if (displayLabel)
      leftMargin += this.LabelWidth;

    if (itemIndex < entities.length)
      item.update(entities[itemIndex], leftMargin + 4);
    else
      item.hide();
  }
}

MonitorRow.prototype.hide = function() {
  this.row.hidden = true;
};

MonitorRow.prototype.IndWidth = 32;
MonitorRow.prototype.LabelWidth = 58;
MonitorRow.prototype.ItemCount = 20;
MonitorRow.prototype.Height = MonitorItem.prototype.ButtonWidth + MonitorItem.prototype.ProgressBarHeight;
MonitorRow.prototype.VerticalGap = 0;
MonitorRow.prototype.MarginTop = 2;
