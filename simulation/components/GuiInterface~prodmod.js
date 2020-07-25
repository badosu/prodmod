/**
 * @param {Object} [prefix]
 * @param {String} method
 * @param {Function} patch
 */
function autociv_patchApplyN()
{
    let prefix, method, patch;
    if (arguments.length < 2)
    {
        let error = new Error("Insufficient arguments to patch: " + method);
        warn(error.message)
        warn(error.stack)
    }
    if (arguments.length == 2)
    {
        prefix = global;
        method = arguments[0];
        patch = arguments[1];
    }
    else
    {
        prefix = arguments[0];
        method = arguments[1];
        patch = arguments[2];
    }

    if (!(method in prefix))
    {
        let error = new Error("Function not defined: " + method);
        warn(error.message)
        warn(error.stack)
        return;
    }

    prefix[method] = new Proxy(prefix[method], { apply: patch });
}

GuiInterface.prototype.prodmod_GetPlayersProduction = function(_currentPlayer, player)
{
  return this.prodmod_RetrieveAndFilterPlayerEntities(player, this.prodmod_GetProductionState);
}

GuiInterface.prototype.prodmod_GetPlayersUnits = function(_currentPlayer, player)
{
  return this.prodmod_RetrieveAndFilterPlayerEntities(player, this.prodmod_GetUnitsState);
}

GuiInterface.prototype.prodmod_RetrieveAndFilterPlayerEntities = function(player, stateFilter)
{
  const cmpRangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	const entities = (player && player > 0) ? cmpRangeManager.GetEntitiesByPlayer(player) : cmpRangeManager.GetNonGaiaEntities();

  let result = [];
  for (let entity of entities) {
    const state = stateFilter(entity);

    if (!state)
      continue;

    result.push({ "entId": entity, "state": state });
  }

  return result;
}

GuiInterface.prototype.prodmod_GetUnitsState = function(ent)
{
  let ret = {};

	let cmpTemplateManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager);
	let template = cmpTemplateManager.GetTemplate(cmpTemplateManager.GetCurrentTemplateName(ent));
	if (!(template && template.Identity && template.Identity.Classes && template.Identity.Classes["_string"].indexOf("Unit") > -1))
		return null;

  ret.template = {
    "name": template.Identity.GenericName,
    "icon": template.Identity.Icon,
  };

	let cmpOwnership = Engine.QueryInterface(ent, IID_Ownership);
	if (cmpOwnership) {
		ret.player = cmpOwnership.GetOwner();
  } else {
    return null;
  }

  return ret;
}

GuiInterface.prototype.prodmod_GetProductionState = function(ent)
{
  let ret = {};

	let cmpOwnership = Engine.QueryInterface(ent, IID_Ownership);
	if (cmpOwnership) {
		ret.player = cmpOwnership.GetOwner();
  } else {
    return null;
  }

	let cmpTemplateManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_TemplateManager);

	let cmpFoundation = QueryMiragedInterface(ent, IID_Foundation);
	if (cmpFoundation) {
  	if (Engine.QueryInterface(ent, IID_Mirage))
  		return null;

	  let template = cmpTemplateManager.GetTemplate(cmpTemplateManager.GetCurrentTemplateName(ent));
	  if (!template || !template.Identity)
	  	return null;

    ret.template = {
      "name": template.Identity.GenericName,
      "icon": template.Identity.Icon
    };

		ret.foundation = 1;

	  let cmpHealth = QueryMiragedInterface(ent, IID_Health);
	  if (!cmpHealth)
      return null;

  	ret.hitpoints = cmpHealth.GetHitpoints();
  	ret.maxHitpoints = cmpHealth.GetMaxHitpoints();
    ret.progress = ret.hitpoints / ret.maxHitpoints;
    ret.timeRemaining = cmpFoundation.GetBuildTime().timeRemaining;
  } else {
    let cmpProductionQueue = Engine.QueryInterface(ent, IID_ProductionQueue);
    if (!cmpProductionQueue)
      return null;

    const queue = cmpProductionQueue.GetQueue();
    if (queue.length == 0)
      return null;

    const batch = queue[0];
		ret.production = { "count": batch.count };
    ret.progress = batch.progress;
    ret.timeRemaining = batch.timeRemaining / 1000.0;

    if (batch.unitTemplate) {
	    let unitTemplate = cmpTemplateManager.GetTemplate(batch.unitTemplate);

	    if (!unitTemplate || !unitTemplate.Identity)
	    	return null;

      ret.template = {
        "name": unitTemplate.Identity.GenericName,
        "icon": unitTemplate.Identity.Icon
      };
      ret.production.kind = "unit";

    } else if (batch.technologyTemplate) {
      let technologyTemplate = TechnologyTemplates.Get(batch.technologyTemplate);

      if (!technologyTemplate)
        return null;

      ret.template = {
        "name": technologyTemplate.genericName,
        "icon": "technologies/" + technologyTemplate.icon
      };
      ret.production.kind = "technology";
    }
  }

	let cmpPosition = Engine.QueryInterface(ent, IID_Position);
	if (cmpPosition && cmpPosition.IsInWorld())
		ret.position = cmpPosition.GetPosition();

  return ret;
}

// Adding a new key to the exposedFunctions object doesn't work,
// must patch the original function
let prodmod_exposedFunctions = {
    "prodmod_GetPlayersProduction": 1,
    "prodmod_GetPlayersUnits": 1,
};

autociv_patchApplyN(GuiInterface.prototype, "ScriptCall", function (target, that, args)
{
    let [player, name, vargs] = args;
    return name in prodmod_exposedFunctions ? that[name](player, vargs) :
        target.apply(that, args);
})

Engine.ReRegisterComponentType(IID_GuiInterface, "GuiInterface", GuiInterface);
