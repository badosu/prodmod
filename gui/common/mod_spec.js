function nestCallback (fn1, fn2) {
  return function (...args) {
    fn1(...args);
    return fn2(...args);
  };
}

hasSameMods = (function (original) {
  return function (modsA, modsB) {
    let mod = name => !name[0].startsWith('specmod');
    return original(modsA.filter(mod), modsB.filter(mod));
  }
})(hasSameMods);

