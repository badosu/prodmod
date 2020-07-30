function Mode(label, tooltip) {
  this.label = label;
  this.tooltip = tooltip;
}

Mode.prototype.getLabel = function() {
  return this.label;
}

Mode.prototype.getTooltip = function() {
  return this.tooltip;
}
