function MonitorRow(rowIndex, playerState, displayLabel) {
  let row = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]`);
  this.ind = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Ind`);
  this.label = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Label`);
  this.resourcesGathered = [[Date.now(), playerState.statistics.resourcesGathered]];
  let sizeTop = rowIndex * (this.Height + this.VerticalGap) + this.MarginTop;
  if (displayLabel)
    sizeTop += Monitor.prototype.TitleHeight;

  row.size = `0 ${sizeTop} 100% ${sizeTop + this.Height}`;
  row.hidden = false;
  const color = playerState.color;
  const colorSprite = `color: ${color.r * 255} ${color.g * 255} ${color.b * 255} 255`;

  this.ind.sprite = colorSprite;

  this.items = [];
  this.row = row;

  for (let i = 0; i < this.ItemCount; i++)
    this.items.push(new MonitorItem(rowIndex, i, color));
}

MonitorRow.prototype.update = function(entities, playerState) {
  let label;
  if (playerState) {
    label = playerState.name.split(' ')[0].slice(0, 8);
    const pops = `${playerState.popCount}/${playerState.popLimit}`;
    label += `${label.length < 5 ? "\n" : " "}${pops}`;

    const civName = g_CivData[playerState.civ].Name;
    const sequences = playerState.sequences;
    const lastIndex = sequences.time.length - 1;
    let tooltip = `${headerFont(playerState.name)} - ${civName}\n\n`;
    tooltip += `${headerFont("Economy")}          ${resourceIcon('population')} ${pops}\n`;

    const now = Date.now();
    const [then, gatheredThen] = this.resourcesGathered.length > 10 ? this.resourcesGathered.shift() : this.resourcesGathered[0];
    const deltaS = (now - then) / 1000;
    let gatheredNow = playerState.statistics.resourcesGathered;
    delete gatheredNow.vegetarianFood;
    for (let resType in gatheredNow) {
      const resGatheredNow = gatheredNow[resType];
      const rate = ((resGatheredNow - gatheredThen[resType]) / deltaS).toFixed(1);
      const count = playerState.resourceCounts[resType];

      tooltip += `${resourceIcon(resType)} ${count}+${fontColor(`${rate}/s`, 'green')}\n`;
    }
    const tradeIncome = sequences.tradeIncome[lastIndex];
    if (tradeIncome && tradeIncome > 0)
      tooltip += `Trade Income: ${tradeIncome}\n`
    const tributesSent = sequences.tributesSent[lastIndex];
    if (tributesSent && tributesSent > 0)
      tooltip += `Sent: ${fontColor(tributesSent, 'red')}\n`
    const tributesReceived = sequences.tributesReceived[lastIndex];
    if (tributesReceived && tributesReceived > 0)
      tooltip += `Received: ${tfontColor(tributesReceived, 'green')}\n`

    tooltip += `\n${headerFont("Military")}\n`;
    const unitsLost = sequences.unitsLost.total[lastIndex];
    const unitsLostValue = sequences.unitsLostValue[lastIndex];
    const buildingsLostValue = sequences.buildingsLostValue[lastIndex];
    const enemyUnitsKilled = sequences.enemyUnitsKilled.total[lastIndex];
    const enemyUnitsKilledValue = sequences.enemyUnitsKilledValue[lastIndex];
    const enemyBuildingsDestroyedValue = sequences.enemyBuildingsDestroyedValue[lastIndex];
    const buildingsCapturedValue = sequences.buildingsCapturedValue[lastIndex];
    const unitsCapturedValue = sequences.unitsCapturedValue[lastIndex];
    const loot = sequences.lootCollected[lastIndex];
    const kd = enemyUnitsKilled ? +((enemyUnitsKilled / unitsLost).toFixed(1)) : 0;
    tooltip += `K/D: ${fontColor(enemyUnitsKilled, 'green')} ${(unitFont("("+enemyUnitsKilledValue+")"))} / ${fontColor(unitsLost, 'red')} ${(unitFont("("+unitsLostValue+")"))} (${kd})\n`;
    tooltip += `Loot: ${fontColor(loot, 'green')}\n`;
    tooltip += `Res. Killed: ${fontColor(enemyUnitsKilledValue + enemyBuildingsDestroyedValue + unitsCapturedValue + buildingsCapturedValue, 'green')}\n`;
    tooltip += `Res. Lost: ${fontColor(buildingsLostValue + unitsLostValue, 'red')}\n`;

    this.resourcesGathered.push([now, gatheredNow]);

    this.label.tooltip = tooltip;
    this.ind.tooltip = tooltip;
    this.label.caption = label;
    this.label.hidden = false;
  } else {
    this.label.hidden = true;
  }

  for (let itemIndex = 0; itemIndex < this.ItemCount; itemIndex++) {
    let item = this.items[itemIndex];

    if (itemIndex < entities.length)
      item.update(entities[itemIndex], label ? this.LabelWidth : 0);
    else
      item.hide();
  }
}

MonitorRow.prototype.hide = function() {
  this.row.hidden = true;
};

MonitorRow.prototype.LabelWidth = 52;
MonitorRow.prototype.ItemCount = 20;
MonitorRow.prototype.Height = MonitorItem.prototype.ButtonWidth + MonitorItem.prototype.ProgressBarHeight;
MonitorRow.prototype.VerticalGap = 0;
MonitorRow.prototype.MarginTop = 6;
