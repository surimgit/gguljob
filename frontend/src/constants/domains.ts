export const CATEGORY_COLORS: Record<string, string> = {
  웹기술: '#3b82f6',
  웹디자인: '#ec4899',
  모바일: '#f97316',
  AIoT: '#14b8a6',
  인공지능: '#6366f1',
  빅데이터: '#8b5cf6',
  블록체인: '#f59e0b',
  자율주행: '#06b6d4',
  핀테크: '#22c55e',
  메타버스: '#a855f7',
};

export const getCategoryColor = (domain: string): string =>
  CATEGORY_COLORS[domain] ?? '#6b7280';

/** hex 색상을 15% 불투명도의 연한 배경색으로 변환 */
export const getCategoryBgColor = (domain: string): string => {
  const hex = CATEGORY_COLORS[domain] ?? '#6b7280';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
};

/** { text, bg } 쌍으로 반환 */
export const getCategoryColorPair = (domain: string) => ({
  text: getCategoryColor(domain),
  bg: getCategoryBgColor(domain),
});

/** 도메인별 썸네일 그라데이션 */
export const THUMBNAIL_GRADIENTS: Record<string, string> = {
  웹기술:   'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
  웹디자인: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
  모바일:   'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
  AIoT:    'linear-gradient(135deg, #E0F2F1, #B2DFDB)',
  인공지능: 'linear-gradient(135deg, #E8EAF6, #C5CAE9)',
  빅데이터: 'linear-gradient(135deg, #EDE7F6, #D1C4E9)',
  블록체인: 'linear-gradient(135deg, #FFFDE7, #FFF9C4)',
  자율주행: 'linear-gradient(135deg, #E0F7FA, #B2EBF2)',
  핀테크:   'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
  메타버스: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
};
