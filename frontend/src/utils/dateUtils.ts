/** 마감일로부터 D-day 문자열 계산 */
export const calcDday = (deadline: string): string => {
  if (!deadline) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deadline);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '마감';
  if (diff === 0) return 'D-Day';
  return `D-${diff}`;
};

/** D-day 문자열에 따른 색상 반환 */
export const getDdayColor = (dday: string): string => {
  if (dday === '마감') return '#9CA3AF';
  if (dday === 'D-Day' || dday.match(/^D-[1-3]$/)) return '#EF4444';
  if (dday.match(/^D-[4-7]$/)) return '#F2B705';
  return '#6B7280';
};
