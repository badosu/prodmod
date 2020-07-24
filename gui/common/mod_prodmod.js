autociv_patchApplyN("hasSameMods", function (target, that, args)
{
	let mod = ([name, _version]) => !/^specmod*/i.test(name);
	return target.apply(that, args.map(mods => mods.filter(mod)));
})
