function darkenedSprite(color, factor = 0.25) {
  return `color: ${darkenedColor(color, factor)} 255`;
}

function playerColor(player) {
  return `${Math.round(player.color.r * 255)} ${Math.round(player.color.g * 255)} ${Math.round(player.color.b * 255)}`;
}

function darkenedColor(color, factor = 0.25) {
  let r = color.r * 255;
  let g = color.g * 255;
  let b = color.b * 255;

  if (r + g + b < 150)
    factor = 0;

  r *= 1 - factor;
  g *= 1 - factor;
  b *= 1 - factor;

  return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
}

function brightenedColor(color) {
  const threshold = 255.999;

  let amount = 0;
  let r = color.r * 255;
  let g = color.g * 255;
  let b = color.b * 255;
  let m = Math.max(r, g, b);

  if (m < 150) {
    amount = 100;
  } else if (m < 170 || b == 200) { //red purple
    amount = 70;
  }

  r += amount;
  g += amount;
  b += amount;
  m = Math.max(r, g, b);

  if (m > threshold) {
    const total = r + g + b;
    if (total >= 3 * threshold) {
      r = g = b = threshold;
    } else {
      const x = (3 * threshold - total) / (3 * m - total);
      const gray = threshold - x * m;
      r = gray + x * r;
      g = gray + x * g;
      b = gray + x * b;
    }
  }

  return `${Math.floor(r)} ${Math.floor(g)} ${Math.floor(b)}`;
}

function brightenedSprite(color) {
  return `color: ${brightenedColor(color)} 255`;
}

function templateTooltip(playerState, template) {
  let tooltip = formattedPlayerName(playerState) + ' - ' + template.name;

  if (template.timeRemaining && (!template.foundation || template.timeRemaining > 0))
    tooltip += `: ${Math.ceil(template.timeRemaining)}s`

  if (template.description)
    tooltip += "\n" + template.description;

  return tooltip;
}

function unitNameWithRank(name, rank) {
  let ret = "";
  if (rank && rank !== "Basic")
    ret += translateWithContext("Rank", rank) + " ";

  return ret + name;
}

function formattedPlayerName(playerState) {
  return setStringTags(playerState.name, { "font": "sans-bold-13", "color": playerState.brightenedColor });
}

function fontColor(text, color) {
  return setStringTags(text.toString(), { "color": color });
}

function pp(str) {
  if (typeof str === 'undefined') {
    str = 'undefined';
  } else if (typeof str !== 'string') {
    str = JSON.stringify(str);
  }

  warn(str);
}
