function UnitsMode() {
  Mode.call(this, 'Units', 'Units Overview');

  this.templateCache = {};
}

UnitsMode.prototype = Object.create(Mode.prototype);

UnitsMode.prototype.getTemplateData = function(templateName) {
  if (!this.templateCache[templateName])
    this.templateCache[templateName] = GetTemplateData(templateName);

  return this.templateCache[templateName];
}


UnitsMode.prototype.getQueues = function() {
  const playerStates = g_monitor_Manager.playerStates;

  let queues = {};

  for (let playerId in playerStates) {
    playerId = parseInt(playerId);
    const playerState = playerStates[playerId];
    const unitCounts = playerState["typeCountsByClass"]["Unit"];

    let queue = [];
    const templates = Object.keys(unitCounts);
    const states = Engine.GuiInterfaceCall('monitor_GetTemplateEntities', [playerId, templates]);

    // Group duplicate templates
    // e.g. units/cart_mechanical_siege_ballista_packed, units/cart_mechanical_siege_ballista_unpacked
    // resource|gaia/fauna_goat_trainable, gaia/fauna_goat_trainable
    for (let kind in unitCounts) {
      let newTemplate;

      if (kind.endsWith('_unpacked'))
        newTemplate = kind.slice(0, kind.length - 9) + '_packed';
      else if (kind.startsWith('resource|'))
        newTemplate = kind.slice(9);
      else
        continue;

      unitCounts[newTemplate] = (unitCounts[newTemplate] || 0) + unitCounts[kind];
      delete unitCounts[kind];
    }

    for (let kind in unitCounts) {
      if (!unitCounts[kind])
        continue;

      const state = states[templates.indexOf(kind)];

      if (!state)
        continue;

      const template = this.getTemplateData(kind);

      let item = {
        "count": unitCounts[kind],
        "icon": template.icon,
        "position": state.position
      };

      const segments = kind.split('_');
      const rank = Monitor.prototype.Ranks[segments[segments.length - 1]];
      if (rank)
        item['rank'] = rank;

      let tooltip = `${formattedPlayerName(playerState)} - ${unitNameWithRank(template.name.generic, rank)}\n`;
      //tooltip += [
      //  getAttackTooltip,
      //  getHealerTooltip,
      //  getArmorTooltip,
      //  getGatherTooltip,
      //  getSpeedTooltip,
      //  getGarrisonTooltip,
      //  getProjectilesTooltip,
      //  getResourceTrickleTooltip
      //].map(func => func(state)).filter(tip => tip).join("\n");

      item.tooltip = tooltip;

      queue.push(item);
    }

    queues[playerId] = queue;
  }

  return queues;
}
