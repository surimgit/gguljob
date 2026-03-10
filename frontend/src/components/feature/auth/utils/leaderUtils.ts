export const getLeaderType = (score: number): { emoji: string; label: string } => {
  if (score <= 20) return { emoji: '🤝', label: '팔로워형' };
  if (score <= 40) return { emoji: '🤝', label: '팔로워 성향' };
  if (score <= 60) return { emoji: '⚖️', label: '밸런스형' };
  if (score <= 80) return { emoji: '👑', label: '리더 성향' };
  return { emoji: '👑', label: '리더형' };
};
