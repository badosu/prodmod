autociv_patchApplyN("hasSameMods", function (target, that, args)
{
	let mod = ([name, _version]) => !/^monitor*/i.test(name);
	return target.apply(that, args.map(mods => mods.filter(mod)));
})

autociv_patchApplyN("hasSameMods", function (target, that, args)
{
	let mod = ([name, version]) => !/^FGod.*/i.test(name);
	return target.apply(that, args.map(mods => mods.filter(mod)));
})

autociv_patchApplyN("hasSameMods", function (target, that, args)
{
	let mod = ([name, version]) => !/^AutoCiv.*/i.test(name);
	return target.apply(that, args.map(mods => mods.filter(mod)));
})
