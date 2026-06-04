export const theme = {
  colors: {
    background: '#0b1220',
    backgroundAlt: '#111a2d',
    card: 'rgba(18, 28, 46, 0.84)',
    cardStrong: 'rgba(16, 24, 39, 0.96)',
    stroke: 'rgba(148, 163, 184, 0.18)',
    strokeStrong: 'rgba(148, 163, 184, 0.28)',
    primary: '#4f8cff',
    primaryStrong: '#2f6df2',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    text: '#e5eefc',
    textStrong: '#ffffff',
    muted: '#93a8c7',
    mutedSoft: '#6f87a8',
    overlay: 'rgba(3, 8, 20, 0.72)',
    input: 'rgba(11, 18, 32, 0.82)',
    shadow: '#020617',
  },
  gradients: {
    screen: ['#08101d', '#0b1220', '#111b31'],
    header: ['rgba(79,140,255,0.22)', 'rgba(34,197,94,0.08)', 'rgba(245,158,11,0.02)'],
    primary: ['#5aa2ff', '#2f6df2'],
    success: ['#2dd4bf', '#16a34a'],
    warning: ['#fbbf24', '#f59e0b'],
    darkCard: ['rgba(19,29,48,0.95)', 'rgba(13,21,38,0.92)'],
  },
  radius: {
    sm: 12,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
  },
};

export function alpha(hex, opacity) {
  const safeHex = hex.replace('#', '');
  const normalized = safeHex.length === 3
    ? safeHex.split('').map((char) => char + char).join('')
    : safeHex;
  const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `#${normalized}${alphaHex}`;
}
