function brightenedSprite(color) {
  const threshold = 255.999;

  let amount = 0;
  let r = color.r * 255;
  let g = color.g * 255;
  let b = color.b * 255;
  let m = Math.max(r, g, b);

  if (m < 150) {
    amount = 100;
  } else if (m < 170) {
    amount = 40;
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

  return `color: ${Math.floor(r)} ${Math.floor(g)} ${Math.floor(b)} 255`;
}

function pp(str) {
  if (typeof str === 'undefined') {
    str = 'undefined';
  } else if (typeof str !== 'string') {
    str = JSON.stringify(str);
  }

  warn(str);
}
