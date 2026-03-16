interface MedalColors {
  border: string;
  ring: string;
  ringStroke: string;
  inner: string;
  numFill: string;
  numStroke: string;
}

const RIBBON = {
  outline: '#7F1D1D',
  foldDark: '#991B1B',
  center: '#EF4444',
  tail: '#7F1D1D',
  highlight: 'rgba(255,255,255,0.28)',
  dots: 'rgba(255,255,255,0.38)',
};

const MedalSVG = ({ c, rank }: { c: MedalColors; rank: number }) => (
  <svg viewBox="0 0 160 172" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
    {/* 외곽 다크 보더 */}
    <circle cx="80" cy="74" r="70" fill={c.border} />
    {/* 메인 링 */}
    <circle cx="80" cy="74" r="65" fill={c.ring} />
    {/* 내부 장식 링 */}
    <circle cx="80" cy="74" r="52" fill="none" stroke={c.ringStroke} strokeWidth="4.5" />
    {/* 내부 원반 */}
    <circle cx="80" cy="74" r="46" fill={c.inner} />
    {/* 순위 숫자 */}
    <text
      x="80"
      y="74"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize="46"
      fontWeight="900"
      fill={c.numFill}
      stroke={c.numStroke}
      strokeWidth="2.5"
      paintOrder="stroke"
    >
      {rank}
    </text>

    {/* 리본 왼쪽 fold 꼬리 삼각형 */}
    <polygon points="12,151 40,151 12,165" fill={RIBBON.tail} />
    {/* 리본 오른쪽 fold 꼬리 삼각형 */}
    <polygon points="148,151 120,151 148,165" fill={RIBBON.tail} />

    {/* 리본 전체 아웃라인 */}
    <rect x="14" y="124" width="132" height="28" rx="4" fill={RIBBON.outline} />
    {/* 왼쪽 어두운 fold-back 영역 */}
    <rect x="16" y="126" width="28" height="24" rx="3" fill={RIBBON.foldDark} />
    {/* 오른쪽 어두운 fold-back 영역 */}
    <rect x="116" y="126" width="28" height="24" rx="3" fill={RIBBON.foldDark} />
    {/* 중앙 밝은 영역 */}
    <rect x="44" y="126" width="72" height="24" fill={RIBBON.center} />
    {/* 상단 하이라이트 */}
    <rect x="44" y="126" width="72" height="6" fill={RIBBON.highlight} />

    {/* 점묘 텍스처 (우측 하단) */}
    {([[108, 145], [114, 145], [111, 141], [117, 141], [105, 141]] as [number, number][]).map(
      ([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.8" fill={RIBBON.dots} />
      ),
    )}
  </svg>
);

const SILVER: MedalColors = {
  border: '#555555',
  ring: '#ACACAC',
  ringStroke: '#D0D0D0',
  inner: '#C6C6C6',
  numFill: '#EFEFEF',
  numStroke: '#606060',
};

const BRONZE: MedalColors = {
  border: '#7A5130',
  ring: '#C07830',
  ringStroke: '#DFA050',
  inner: '#CF8838',
  numFill: '#F0C070',
  numStroke: '#7A5130',
};

export const SilverMedalIcon = () => <MedalSVG c={SILVER} rank={2} />;
export const BronzeMedalIcon = () => <MedalSVG c={BRONZE} rank={3} />;