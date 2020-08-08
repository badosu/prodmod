function MonitorItem(rowIndex, itemIndex, color) {
  this.itemIndex = itemIndex;
  this.icon = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Item[${itemIndex}]Icon`);
  this.btn = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Item[${itemIndex}]Btn`);
  this.cnt = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Item[${itemIndex}]Count`);
  this.progress = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Item[${itemIndex}]Prg`);
  this.rank = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Item[${itemIndex}]Rank`);
  this.progress.sprite = brightenedSprite(color);

  this.btn.onPress = this.onPress.bind(this);
}

MonitorItem.prototype.calculateSize = function(leftMargin) {
  let buttonLeft = leftMargin + (this.ButtonWidth + this.HorizontalGap) * this.itemIndex;
  let size = this.btn.size;
  size.left = buttonLeft;
  size.right = buttonLeft + this.ButtonWidth;
  size.top = this.item.progress ? 0 : 1;
  return size;
}

MonitorItem.prototype.update = function(item, leftMargin = 0) {
  this.item = item;
  this.icon.sprite = this.PortraitDirectory + (item.icon ? item.icon : item.template.icon);

  let btnSize = this.calculateSize(leftMargin);
  let progressSize = this.progress.size;
  if (item.progress) {
    this.progress.hidden = false;
    btnSize.bottom = this.ButtonWidth + this.ProgressBarHeight;
    progressSize.right = this.BorderWidth + (this.ButtonWidth - 2 * this.BorderWidth) * item.progress;
  } else {
    this.progress.hidden = true;
    btnSize.bottom = this.ButtonWidth;
  }
  this.progress.size = progressSize;
  this.btn.size = btnSize;

  let tooltip = item.tooltip;

  this.btn.tooltip = tooltip;
  this.btn.hidden = false;
  this.cnt.caption = item.count && item.count > 1 ? item.count : "";

  if (item.rank && item.rank !== "Basic") {
    this.rank.sprite = this.RankDirectory + item.rank + ".png";
    this.rank.hidden = false;
  } else {
    this.rank.hidden = true;
  }
}

MonitorItem.prototype.onPress = function() {
  if (!this.item.position)
    return;

  Engine.CameraMoveTo(this.item.position.x, this.item.position.z);
}

MonitorItem.prototype.hide = function() {
  this.btn.hidden = true;
  this.progress.hidden = true;
}

MonitorItem.prototype.HorizontalGap = 2;
MonitorItem.prototype.ButtonWidth = 34;
MonitorItem.prototype.BorderWidth = 3;
MonitorItem.prototype.ProgressBarHeight = 3;
MonitorItem.prototype.PortraitDirectory = "stretched:session/portraits/";
MonitorItem.prototype.RankDirectory = "stretched:session/icons/ranks/";
