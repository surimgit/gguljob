export type MatchStatus = '최적합' | '적합' | '보통' | '미흡' | '부족';

export type MatchType = 'excellent' | 'good' | 'average' | 'poor' | 'insufficient';

export const MATCH_STATUS_TO_TYPE: Record<MatchStatus, MatchType> = {
  최적합: 'excellent',
  적합: 'good',
  보통: 'average',
  미흡: 'poor',
  부족: 'insufficient',
};

export const MATCH_CONFIG: Record<MatchType, { label: string; color: string; dots: number }> = {
  excellent:    { label: '최적합', color: '#16A34A', dots: 5 },
  good:         { label: '적합',   color: '#22C55E', dots: 4 },
  average:      { label: '보통',   color: '#F2B705', dots: 3 },
  poor:         { label: '미흡',   color: '#F97316', dots: 2 },
  insufficient: { label: '부족',   color: '#EF4444', dots: 1 },
};

export const MATCH_RANK: Record<MatchType, number> = {
  excellent: 5, good: 4, average: 3, poor: 2, insufficient: 1,
};
