function MonitorItem(rowIndex, itemIndex, color) {
  this.itemIndex = itemIndex;
  this.icon = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Item[${itemIndex}]Icon`);
  this.btn = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Item[${itemIndex}]Btn`);
  this.cnt = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Item[${itemIndex}]Count`);
  this.progress = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Item[${itemIndex}]Prg`);
  this.rank = Engine.GetGUIObjectByName(`MonitorRow[${rowIndex}]Item[${itemIndex}]Rank`);
  this.progress.sprite = brightenedSprite(color);

  const buttonLeft = this.LeftMargin + (this.ButtonWidth + this.HorizontalGap) * this.itemIndex;
  let size = this.btn.size;
  size.left = buttonLeft;
  size.right = buttonLeft + this.ButtonWidth;
  this.btn.size = size;

  this.btn.onPress = this.onPress.bind(this);
}

MonitorItem.prototype.update = function(item) {
  this.item = item;
  this.icon.sprite = this.PortraitDirectory + item.template.icon;

  let btnSize = this.btn.size;
  let progressSize = this.progress.size;
  if (item.progress && (!item.foundation || item.hitpoints > 1)) {
    this.progress.hidden = false;
    btnSize.bottom = this.ButtonWidth + this.ProgressBarHeight;
    progressSize.right = this.BorderWidth + (this.ButtonWidth - 2 * this.BorderWidth) * item.progress;
  } else {
    this.progress.hidden = true;
    btnSize.bottom = this.ButtonWidth;
  }
  this.progress.size = progressSize;
  this.btn.size = btnSize;

  let tooltip = "";

  if (item.playerName)
    tooltip = item.playerName.split(' ')[0] + ' - ';

  if (item.rank && item.rank !== "Basic" && !item.hideRankInfo)
    tooltip += translateWithContext("Rank", item.rank) + ' ';

  tooltip += item.template.name;
  if (item.timeRemaining && (!item.foundation || item.timeRemaining > 0))
    tooltip += `: ${Math.ceil(item.timeRemaining)}s`

  if (item.description) {
    tooltip += "\n" + item.description;
  }

  this.btn.tooltip = tooltip;
  this.btn.hidden = false;

  if (item.count) {
    this.cnt.caption = item.count;
  } else if (item.production && item.production.kind == "unit") {
    this.cnt.caption = item.production.count;
  } else {
    this.cnt.caption = "";
  }

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

MonitorItem.prototype.LeftMargin = 12;
MonitorItem.prototype.HorizontalGap = 2;
MonitorItem.prototype.ButtonWidth = 34;
MonitorItem.prototype.BorderWidth = 3;
MonitorItem.prototype.ProgressBarHeight = 3;
MonitorItem.prototype.PortraitDirectory = "stretched:session/portraits/";
MonitorItem.prototype.RankDirectory = "stretched:session/icons/ranks/";
