function MonitorRow(rowIndex, playerState, displayLabel) {
  const row = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]`);
  this.ind = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Ind`);
  const indIcon = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]IndIcon`);
  const indTeam = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]IndTeam`);
  if (!playerState.hideTeam)
    indTeam.caption = playerState.team + 1;
  indIcon.sprite = "stretched:" + g_CivData[playerState.civ].Emblem;
  this.label = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Label`);
  this.resourcesGathered = [[g_SimState.timeElapsed, playerState.statistics.resourcesGathered]];
  let sizeTop = rowIndex * (this.Height + this.VerticalGap) + this.MarginTop;
  if (displayLabel)
    sizeTop += Monitor.prototype.TitleHeight;

  row.size = `0 ${sizeTop} 100% ${sizeTop + this.Height}`;
  row.hidden = false;

  const color = playerState.color;
  this.ind.sprite = darkenedSprite(color);

  this.items = [];
  this.row = row;

  for (let i = 0; i < this.ItemCount; i++)
    this.items.push(new MonitorItem(rowIndex, i, color));
}

MonitorRow.prototype.update = function(entities, playerState, displayLabel, maxPop) {
  const ccTemplate = Object.keys(playerState.typeCountsByClass.CivCentre || {})[0];
  if (ccTemplate) {
    const ccEntity = Engine.GuiInterfaceCall('prodmod_GetTemplateEntities', [playerState.id, [ccTemplate]])[0];

    if (ccEntity) {
      const moveToCC = function() {
        Engine.CameraMoveTo(ccEntity.position.x, ccEntity.position.z);
      };

      this.ind.onPress = moveToCC;
      this.label.onPress = moveToCC;
    }
  }

  const civName = g_CivData[playerState.civ].Name;
  const sequences = playerState.sequences;
  const lastIndex = sequences.time.length - 1;

  let tooltip = `${formattedPlayerName(playerState)} - ${civName}\n`;
  tooltip += `${headerFont('Economy')} - Phase ${headerFont(this.Phases[playerState.phase])}\n`;

  const now = g_SimState.timeElapsed;
  const [then, gatheredThen] = this.resourcesGathered.length > this.IncomeRateBufferSize ? this.resourcesGathered.shift() : this.resourcesGathered[0];
  const deltaS = (now - then) / 1000;
  let gatheredNow = playerState.statistics.resourcesGathered;

  delete gatheredNow.vegetarianFood;
  for (let resType in gatheredNow) {
    const resGatheredNow = gatheredNow[resType];
    const rate = ((resGatheredNow - gatheredThen[resType]) / deltaS).toFixed(1);
    const count = playerState.resourceCounts[resType];

    tooltip += `${resourceIcon(resType)} ${count}+${fontColor(`${rate}/s`, 'green')}\n`;
  }

  tooltip += `${headerFont('Military')} (${headerFont(playerState.classCounts.Soldier || '0')})\n`;
  const unitsLost = sequences.unitsLost.total[lastIndex];
  const unitsLostValue = sequences.unitsLostValue[lastIndex];
  const buildingsLostValue = sequences.buildingsLostValue[lastIndex];
  const enemyUnitsKilled = sequences.enemyUnitsKilled.total[lastIndex];
  const enemyUnitsKilledValue = sequences.enemyUnitsKilledValue[lastIndex];
  const enemyBuildingsDestroyedValue = sequences.enemyBuildingsDestroyedValue[lastIndex];
  const buildingsCapturedValue = sequences.buildingsCapturedValue[lastIndex];
  const unitsCapturedValue = sequences.unitsCapturedValue[lastIndex];
  const loot = sequences.lootCollected[lastIndex];
  const kd = enemyUnitsKilled ? + ((enemyUnitsKilled / unitsLost).toFixed(2)) : 0;
  tooltip += `K/D: ${fontColor(enemyUnitsKilled, 'green')} ${(unitFont("("+enemyUnitsKilledValue+")"))} / ${fontColor(unitsLost, 'red')} ${(unitFont("("+unitsLostValue+")"))} - ${kd}\n`;
  tooltip += `Loot: ${fontColor(loot, 'green')}\n`;
  tooltip += `Res. Killed: ${fontColor(enemyUnitsKilledValue + enemyBuildingsDestroyedValue + unitsCapturedValue + buildingsCapturedValue, 'green')}\n`;
  tooltip += `Res. Lost: ${fontColor(buildingsLostValue + unitsLostValue, 'red')}\n`;

	let totalBought = 0;
	let totalSold = 0;
	for (let type in sequences.resourcesBought)
		totalBought += sequences.resourcesBought[type][lastIndex];
	for (let type in sequences.resourcesSold)
		totalSold += sequences.resourcesSold[type][lastIndex];

  if (totalSold)
    tooltip += `\nBarter ef.: ${Math.floor(100 * totalBought / totalSold)}%`
  const tradeIncome = sequences.tradeIncome[lastIndex];
  if (tradeIncome)
    tooltip += `\nTrade Income: ${tradeIncome}`
  const tributesSent = sequences.tributesSent[lastIndex];
  if (tributesSent)
    tooltip += `\nRes. Sent: ${fontColor(tributesSent, 'red')}`
  const tributesReceived = sequences.tributesReceived[lastIndex];
  if (tributesReceived)
    tooltip += `\nRes. Received: ${fontColor(tributesReceived, 'green')}\n`

  this.resourcesGathered.push([now, gatheredNow]);

  this.ind.tooltip = tooltip;

  if (displayLabel) {
    let label = setStringTags(
      playerState.name.slice(0, 8),
      { "font": "mono-stroke-10", "color": brightenedColor(playerState.color) }
    );
    const popCount = playerState.popCount == maxPop ? headerFont(playerState.popCount) : playerState.popCount;
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
MonitorRow.prototype.IncomeRateBufferSize = 25;
MonitorRow.prototype.Phases = { 'village': 'I', 'town': 'II', 'city': 'III' };
