function MonitorRow(rowIndex, playerState, displayLabel) {
  let row = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]`);
  let ind = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Ind`);
  this.label = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Label`);
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

MonitorRow.prototype.update = function(entities, label) {
  if (label) {
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
