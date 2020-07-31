function MonitorRow(rowIndex, playerState, displayLabel) {
  let row = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]`);
  let ind = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Ind`);
  this.label = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Label`);
  this.resourcesGathered = [[Date.now(), playerState.statistics.resourcesGathered]];
  let sizeTop = rowIndex * (this.Height + this.VerticalGap) + this.MarginTop;
  if (displayLabel)
    sizeTop += Monitor.prototype.TitleHeight;

  row.size = `0 ${sizeTop} 100% ${sizeTop + this.Height}`;
  row.hidden = false;
  const color = playerState.color;
  const colorSprite = `color: ${color.r * 255} ${color.g * 255} ${color.b * 255} 255`;

  ind.sprite = colorSprite;
  const civName = g_CivData[playerState.civ].Name;
  ind.tooltip = `${playerState.name} - ${civName}`;

  this.items = [];
  this.row = row;

  for (let i = 0; i < this.ItemCount; i++)
    this.items.push(new MonitorItem(rowIndex, i, color));
}

MonitorRow.prototype.update = function(entities, playerState) {
  let label;
  if (playerState) {
    label = playerState.name.split(' ')[0].slice(0, 8);
    label += `${label.length < 5 ? "\n" : " "}${playerState.popCount}/${playerState.popLimit}`;

    let tooltip = '';

    const now = Date.now();
    const [then, gatheredThen] = this.resourcesGathered.length > 10 ? this.resourcesGathered.shift() : this.resourcesGathered[0];
    const deltaS = (now - then) / 1000;
    let gatheredNow = playerState.statistics.resourcesGathered;
    delete gatheredNow.vegetarianFood;
    for (let resType in gatheredNow) {
      const resGatheredNow = gatheredNow[resType];
      const rate = ((resGatheredNow - gatheredThen[resType]) / deltaS).toFixed(1);
      const count = playerState.resourceCounts[resType];
      const rateS = setStringTags(`${rate}/s`, { color: 'green' });

      tooltip += `${resourceIcon(resType)} ${count}+${rateS}\n`;
    }

    this.resourcesGathered.push([now, gatheredNow]);

    this.label.tooltip = tooltip;
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
