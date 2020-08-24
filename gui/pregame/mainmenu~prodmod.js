function monitor_initCheck()
{
  let state = {
      "needsRestart": false,
      "reasons": new Set()
  };

  const configSaveToMemoryAndToDisk = (key, value) =>
  {
      Engine.ConfigDB_CreateValue("user", key, value);
      Engine.ConfigDB_WriteValueToFile("user", key, value, "config/user.cfg");
      state.needsRestart = true;
  }

  // Check settings
  {
    const settings = Engine.ReadJSONFile("monitor_data/default_config.json");

    // Normal check. Check for settings entries missing
    for (let key in settings) {
      if (!Engine.ConfigDB_GetValue("user", key)) {
        configSaveToMemoryAndToDisk(key, settings[key]);
        state.reasons.add("New monitor settings added.");
      }
    }
  }

  return state;
};

autociv_patchApplyN("init", function (target, that, args)
{
  const state = monitor_initCheck();

  if (state.needsRestart) {
    const message = ["0 A.D needs to restart.\n", "Reasons:\n"].
        concat(Array.from(state.reasons).map(v => ` · ${v}`)).
        join("\n");

    messageBox(500, 300, message,
        "monitor mod notice",
        ["Cancel", "Restart"],
        [() => { }, () => Engine.RestartEngine()]
    );
  }

  return target.apply(that, args);
})
