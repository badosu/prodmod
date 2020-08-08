function TechMode() {
  Mode.call(this, 'Tech', 'Technologies Overview');
}

TechMode.prototype = Object.create(Mode.prototype);

TechMode.prototype.RankableTechs = [
  ["phase_village", "phase_town", "phase_town_athen", "phase_town_generic", "phase_city", "phase_city_athen", "phase_city_generic"],
  ["gather_lumbering_ironaxes", "gather_lumbering_strongeraxes", "gather_lumbering_sharpaxes"],
  ["gather_farming_plows", "gather_farming_training", "gather_farming_fertilizer"],
  ["gather_mining_servants", "gather_mining_serfs", "gather_mining_slaves"],
  ["gather_mining_wedgemallet", "gather_mining_shaftmining", "gather_mining_silvermining"],
  ["gather_capacity_basket", "gather_capacity_wheelbarrow", "gather_capacity_carts"],
  ["attack_infantry_melee_01", "attack_infantry_melee_02"],
  ["attack_infantry_ranged_01", "attack_infantry_ranged_02"],
  ["attack_cavalry_melee_01", "attack_cavalry_melee_02"],
  ["attack_cavalry_ranged_01", "attack_cavalry_ranged_02"],
  ["armor_infantry_01", "armor_infantry_02"],
  ["armor_cav_01", "armor_cav_02"],
  ["heal_range", "heal_range_2"],
  ["heal_rate", "heal_rate_2"]
];

TechMode.prototype.getQueues = function(players, simulationState) {
  let techs = Engine.GuiInterfaceCall("prodmod_GetResearchedTechs", players);

  // Could just return the value above if we didn't have to group techs :`-(
  const rankKeys = Object.keys(Monitor.prototype.Ranks);
  const rankableTechsSize = this.RankableTechs.length;

  for (let playerId in techs) {
    let extractedTechGroups = new Array(rankableTechsSize).fill(null).map(() => []);
    let playerTechs = techs[playerId];
    let newPlayerTechs = [];
    let isRankableTech = false;

    // for each tech
    for (let playerTech of playerTechs) {
      playerTech.tooltip = templateTooltip(simulationState.players[playerId], playerTech);

      for (let i = 0; i < rankableTechsSize; i++) {
        let rankableTechGroup = this.RankableTechs[i];

        for (let rankableTech of rankableTechGroup) {
          if (playerTech.templateName == rankableTech) {
            extractedTechGroups[i].push(playerTech);
            // break tech search
            i = rankableTechsSize;
            isRankableTech = true;
            break
          }
        }
      }

      if (!isRankableTech) {
        newPlayerTechs.push(playerTech);
      }

      isRankableTech = false;
    }

    let extractedTechs = [];
    for (let techGroup of extractedTechGroups) {
      const ranks = techGroup.length;
      if (ranks == 0)
        continue;

      let lastTech = techGroup[ranks - 1];
      if (ranks > 1 && !lastTech.templateName.startsWith('phase_')) {
        lastTech.rank = Monitor.prototype.Ranks[rankKeys[ranks - 1]];
        lastTech.icon = techGroup[0].icon;
      }
      extractedTechs.push(lastTech);
    }

    techs[playerId] = extractedTechs.concat(newPlayerTechs);
  }

  return techs;
}
