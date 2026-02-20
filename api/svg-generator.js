const LANGUAGE_COLORS = require('./language-colors');
const THEMES = require('./themes');

function generateSVG(languages, theme, hideBorder, title, cardWidth) {
    const colors = THEMES[theme] || THEMES.default;
    const width = cardWidth || 495;
    const height = Math.max(200, 45 + languages.length * 25);
    const border = hideBorder ? 0 : 1;
  
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect data-testid="card-bg" x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="4.5" fill="${colors.bg}" stroke="${colors.border}" stroke-width="${border}"/>
    <g data-testid="card-title" transform="translate(25, 35)">
      <text x="0" y="0" class="title" fill="${colors.title}" font-family="Segoe UI, Verdana, sans-serif" font-size="18" font-weight="bold">${title || 'Top Languages'}</text>
    </g>
    <g transform="translate(0, 55)">`;
  
    languages.forEach((lang, index) => {
      const y = index * 25;
      const color = LANGUAGE_COLORS[lang.name] || '#858585';
      const percent = parseFloat(lang.percent);
      const barWidth = ((width - 50) * percent) / 100;
  
      svg += `
      <g transform="translate(25, ${y})">
        <text x="0" y="15" fill="${colors.text}" font-family="Segoe UI, Verdana, sans-serif" font-size="12">${lang.name}</text>
        <text x="${width - 50}" y="15" fill="${colors.text}" font-family="Segoe UI, Verdana, sans-serif" font-size="12" text-anchor="end">${lang.percent}%</text>
        <rect x="0" y="20" width="${width - 50}" height="8" rx="4" fill="${colors.border}" opacity="0.2"/>
        <rect x="0" y="20" width="${barWidth}" height="8" rx="4" fill="${color}"/>
      </g>`;
    });
  
    svg += `
    </g>
  </svg>`;
  
    return svg;
  }

  module.exports = generateSVG;