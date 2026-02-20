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

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function calculateGrade(stats: Stat[]): string {
  // Simple grade calculation based on activity
  const stars = parseInt(stats.find(s => s.icon === 'stars')?.value.replace('k', '000').replace('.', '') || '0');
  const commits = parseInt(stats.find(s => s.icon === 'commits')?.value.replace('k', '000').replace('.', '') || '0');
  const prs = parseInt(stats.find(s => s.icon === 'prs')?.value.replace('k', '000').replace('.', '') || '0');
  const issues = parseInt(stats.find(s => s.icon === 'issues')?.value.replace('k', '000').replace('.', '') || '0');
  const contributed = parseInt(stats.find(s => s.icon === 'contributed')?.value.replace('k', '000').replace('.', '') || '0');

  // Calculate score (weighted)
  const score = (stars * 0.3) + (commits * 0.25) + (prs * 0.2) + (issues * 0.15) + (contributed * 0.1);

  if (score >= 10000) return 'S+';
  if (score >= 5000) return 'S';
  if (score >= 2000) return 'A++';
  if (score >= 1000) return 'A+';
  if (score >= 500) return 'A';
  if (score >= 200) return 'B+';
  if (score >= 100) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 20) return 'C';
  return 'D';
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
  
  // Compact layout
  const titleHeight = 35;
  const itemHeight = 28; // Reduced from 50
  const bottomPadding = 20; // Reduced from 30
  const statsHeight = stats.length * itemHeight;
  const contentHeight = Math.max(statsHeight, 120); // Minimum height for grade circle
  const height = titleHeight + contentHeight + bottomPadding;
  
  const border = hideBorder ? 0 : 1;
  const borderRadius = 6;
  const fontFamily = "-apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans, Helvetica, Arial, sans-serif";

  // Icons as SVG paths
  const icons: { [key: string]: string } = {
    stars: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    commits: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z',
    prs: 'M7 18c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM7 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm13-4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H4V4h16v12z',
    issues: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
    contributed: 'M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z'
  };

  const grade = calculateGrade(stats);
  const gradeCircleSize = 80;
  const gradeCircleX = width - gradeCircleSize - 25;
  const gradeCircleY = titleHeight + (contentHeight / 2);
  const statsSectionWidth = gradeCircleX - 50;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font-weight: 600; }
      .stat-label { font-weight: 500; }
      .stat-value { font-weight: 600; }
      .grade-text { font-weight: 700; }
    </style>
  </defs>
  <rect data-testid="card-bg" x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${borderRadius}" fill="${colors.bg}" stroke="${colors.border}" stroke-width="${border}"/>
  <g data-testid="card-title" transform="translate(25, 25)">
    <text x="0" y="0" class="title" fill="${colors.title}" font-family="${fontFamily}" font-size="18" font-weight="600">${escapeXml(title || 'GitHub Stats')}</text>
  </g>
  <g transform="translate(0, ${titleHeight + 5})">`;

  // Stats on the left
  stats.forEach((stat, index) => {
    const y = index * itemHeight;
    const iconPath = icons[stat.icon] || icons.stars;
    const iconSize = 16; // Smaller icons
    const iconX = 25;
    const iconY = y + 12;
    const labelX = 48;
    const labelY = y + 16;
    const valueX = statsSectionWidth;
    const valueY = y + 16;

    const iconTransformY = Math.round(iconY - iconSize / 2);
    svg += `
    <g transform="translate(0, ${y})">
      <path d="${iconPath}" fill="${colors.icon || colors.title}" transform="translate(${iconX}, ${iconTransformY}) scale(0.7)"/>
      <text x="${labelX}" y="${labelY}" class="stat-label" fill="${colors.text}" font-family="${fontFamily}" font-size="12">${escapeXml(stat.label)}</text>
      <text x="${valueX}" y="${valueY}" class="stat-value" fill="${colors.title}" font-family="${fontFamily}" font-size="12" text-anchor="end">${escapeXml(stat.value)}</text>
    </g>`;
  });

  // Grade circle on the right
  const gradeProgress = 0.85; // 85% filled
  const radius = gradeCircleSize / 2 - 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - gradeProgress);

  svg += `
  </g>
  <g transform="translate(${gradeCircleX + gradeCircleSize / 2}, ${gradeCircleY})">
    <!-- Background circle -->
    <circle cx="0" cy="0" r="${radius + 3}" fill="${colors.border}" opacity="0.1"/>
    <!-- Progress ring -->
    <circle cx="0" cy="0" r="${radius}" fill="none" stroke="${colors.border}" stroke-width="4" opacity="0.3"/>
    <circle cx="0" cy="0" r="${radius}" fill="none" stroke="${colors.title}" stroke-width="4" 
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
            transform="rotate(-90)" stroke-linecap="round"/>
    <!-- Grade text -->
    <text x="0" y="8" class="grade-text" fill="${colors.title}" font-family="${fontFamily}" font-size="28" font-weight="700" text-anchor="middle">${grade}</text>
  </g>
</svg>`;

  return svg;
}
