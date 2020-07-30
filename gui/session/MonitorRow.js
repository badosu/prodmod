function MonitorRow(rowIndex, tooltip, displayLabel, color = { r: 255, g: 255, b: 255 }) {
  let row = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]`);
  let ind = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Ind`);
  let sizeTop = rowIndex * (this.Height + this.VerticalGap) + this.MarginTop;
  if (displayLabel)
    sizeTop += Monitor.prototype.TitleHeight;

  row.size = `0 ${sizeTop} ${this.MaxWidth} ${sizeTop + this.Height}`;
  row.hidden = false;
  const colorSprite = `color: ${color.r * 255} ${color.g * 255} ${color.b * 255} 255`;

  ind.sprite = colorSprite;
  ind.tooltip = tooltip;

  this.items = [];
  this.row = row;

  for (let i = 0; i < this.ItemCount; i++)
    this.items.push(new MonitorItem(rowIndex, i, color));
}

MonitorRow.prototype.update = function(entities) {
  for (let itemIndex = 0; itemIndex < this.ItemCount; itemIndex++) {
    let item = this.items[itemIndex];

    if (itemIndex < entities.length) {
      item.update(entities[itemIndex]);
    } else {
      item.hide();
    }
  }
}

MonitorRow.prototype.hide = function() {
  this.row.hidden = true;
};

MonitorRow.prototype.ItemCount = 20;
MonitorRow.prototype.Height = MonitorItem.prototype.ButtonWidth + MonitorItem.prototype.ProgressBarHeight;
MonitorRow.prototype.VerticalGap = 0;
MonitorRow.prototype.MarginTop = 6;
MonitorRow.prototype.MaxWidth = "50%";
