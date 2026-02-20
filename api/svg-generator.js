const LANGUAGE_COLORS = require('./language-colors');
const THEMES = require('./themes');

function generateSVG(languages, theme, hideBorder, title, cardWidth) {
  // Normalize theme name and validate
  const normalizedTheme = (theme || 'default').toLowerCase().trim();
  const colors = THEMES[normalizedTheme] || THEMES.default;
  const width = cardWidth || 495;
  
  // Improved height calculation with proper padding
  const titleHeight = 50;
  const itemHeight = 35; // Increased spacing between items
  const bottomPadding = 30; // Extra padding at bottom to prevent clipping
  const height = titleHeight + (languages.length * itemHeight) + bottomPadding;
  
  const border = hideBorder ? 0 : 1;
  const borderRadius = 6;
  
  // Modern font stack
  const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif';

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font-weight: 600; }
      .lang-name { font-weight: 500; }
      .lang-percent { font-weight: 400; }
    </style>
  </defs>
  <rect data-testid="card-bg" x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${borderRadius}" fill="${colors.bg}" stroke="${colors.border}" stroke-width="${border}"/>
  <g data-testid="card-title" transform="translate(25, 30)">
    <text x="0" y="0" class="title" fill="${colors.title}" font-family="${fontFamily}" font-size="20" font-weight="600">${title || 'Top Languages'}</text>
  </g>
  <g transform="translate(0, 60)">`;

  languages.forEach((lang, index) => {
    const y = index * itemHeight;
    const color = LANGUAGE_COLORS[lang.name] || '#858585';
    const percent = parseFloat(lang.percent);
    const barWidth = ((width - 50) * percent) / 100;
    const barHeight = 10;
    const barY = 22;
    const textY = 16;

    svg += `
    <g transform="translate(25, ${y})">
      <text x="0" y="${textY}" class="lang-name" fill="${colors.text}" font-family="${fontFamily}" font-size="13">${lang.name}</text>
      <text x="${width - 50}" y="${textY}" class="lang-percent" fill="${colors.text}" font-family="${fontFamily}" font-size="13" text-anchor="end">${lang.percent}%</text>
      <rect x="0" y="${barY}" width="${width - 50}" height="${barHeight}" rx="5" fill="${colors.border}" opacity="0.15"/>
      <rect x="0" y="${barY}" width="${barWidth}" height="${barHeight}" rx="5" fill="${color}"/>
    </g>`;
  });

  svg += `
  </g>
</svg>`;

  return svg;
}

module.exports = generateSVG;
