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


UnitsMode.prototype.getQueues = function(players, simulationState) {
  const playerStates = simulationState.players;

  let queues = {};

  for (let playerId of players) {
    const playerState = playerStates[playerId];
    const unitCounts = playerState["typeCountsByClass"]["Unit"];

    let queue = [];
    const templates = Object.keys(unitCounts);
    const positions = Engine.GuiInterfaceCall('prodmod_GetTemplatePositions', [playerId, templates]);

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

      const template = this.getTemplateData(kind);

      let item = {
        "count": unitCounts[kind],
        "playerName": playerState.name,
        "template": {
          "name": template.name.generic,
          "icon": template.icon
        },
        "position": positions[templates.indexOf(kind)]
      };

      const segments = kind.split('_');
      const rank = Monitor.prototype.Ranks[segments[segments.length - 1]];
      if (rank)
        item['rank'] = rank;

      queue.push(item);
    }

    queues[playerId] = queue;
  }

  return queues;
}
