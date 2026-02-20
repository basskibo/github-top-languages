import themes, { Theme } from './themes';

export interface Stat {
  icon: string;
  label: string;
  value: string;
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

export function generateStatsSVG(
  stats: Stat[],
  theme: string | undefined,
  hideBorder: boolean,
  title: string | undefined,
  cardWidth: number | undefined
): string {
  const normalizedTheme = (theme || 'default').toLowerCase().trim();
  const colors: Theme = themes[normalizedTheme] || themes.default;
  const width = cardWidth || 495;
  
  const titleHeight = 50;
  const itemHeight = 50;
  const bottomPadding = 30;
  const height = titleHeight + (stats.length * itemHeight) + bottomPadding;
  
  const border = hideBorder ? 0 : 1;
  const borderRadius = 6;
  const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif';

  // Icons as SVG paths
  const icons: { [key: string]: string } = {
    stars: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    commits: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z',
    prs: 'M7 18c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM7 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm13-4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H4V4h16v12z',
    issues: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
    contributed: 'M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z'
  };

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font-weight: 600; }
      .stat-label { font-weight: 500; }
      .stat-value { font-weight: 600; }
    </style>
  </defs>
  <rect data-testid="card-bg" x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${borderRadius}" fill="${colors.bg}" stroke="${colors.border}" stroke-width="${border}"/>
  <g data-testid="card-title" transform="translate(25, 30)">
    <text x="0" y="0" class="title" fill="${colors.title}" font-family="${fontFamily}" font-size="20" font-weight="600">${title || 'GitHub Stats'}</text>
  </g>
  <g transform="translate(0, 60)">`;

  stats.forEach((stat, index) => {
    const y = index * itemHeight;
    const iconPath = icons[stat.icon] || icons.stars;
    const iconSize = 20;
    const iconX = 25;
    const iconY = y + 15;
    const labelX = 55;
    const labelY = y + 20;
    const valueX = width - 25;
    const valueY = y + 20;

    svg += `
    <g transform="translate(0, ${y})">
      <path d="${iconPath}" fill="${colors.icon || colors.title}" transform="translate(${iconX}, ${iconY - iconSize/2}) scale(0.8)"/>
      <text x="${labelX}" y="${labelY}" class="stat-label" fill="${colors.text}" font-family="${fontFamily}" font-size="14">${stat.label}</text>
      <text x="${valueX}" y="${valueY}" class="stat-value" fill="${colors.title}" font-family="${fontFamily}" font-size="14" text-anchor="end">${stat.value}</text>
    </g>`;
  });

  svg += `
  </g>
</svg>`;

  return svg;
}

