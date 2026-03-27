/**
 * ISO 날짜 문자열을 "N분 전 / N시간 전 / N일 전" 형식으로 반환합니다.
 */
export const timeAgo = (dateStr: string): string => {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${Math.floor(diffHour / 24)}일 전`;
};
