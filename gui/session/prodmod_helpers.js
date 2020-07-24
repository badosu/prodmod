function brightenedSprite(color, amount) {
  const threshold = 255.999;

  let r = color.r * 255;
  let g = color.g * 255;
  let b = color.b * 255;

  if (Math.max(r, g, b) < 150) { // low enough to increase
    r += amount;
    g += amount;
    b += amount;
    const m = Math.max(r, g, b);

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
  }

  return `color: ${Math.floor(r)} ${Math.floor(g)} ${Math.floor(b)} 255`;
}
