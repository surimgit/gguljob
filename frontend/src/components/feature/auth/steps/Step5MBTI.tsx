import { type FC } from 'react';

const MBTI_ROWS = [
  ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
  ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
  ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
  ['ISTP', 'ISFP', 'ESTP', 'ESFP'],
];

// 그룹별 색상 매핑
const MBTI_GROUP: Record<string, { color: string; name: string }> = {
  INTJ: { color: '#EF4444', name: '분석가' },
  INTP: { color: '#EF4444', name: '분석가' },
  ENTJ: { color: '#EF4444', name: '분석가' },
  ENTP: { color: '#EF4444', name: '분석가' },
  INFJ: { color: '#60A5FA', name: '외교관' },
  INFP: { color: '#60A5FA', name: '외교관' },
  ENFJ: { color: '#60A5FA', name: '외교관' },
  ENFP: { color: '#60A5FA', name: '외교관' },
  ISTJ: { color: '#34D399', name: '관리자' },
  ISFJ: { color: '#34D399', name: '관리자' },
  ESTJ: { color: '#34D399', name: '관리자' },
  ESFJ: { color: '#34D399', name: '관리자' },
  ISTP: { color: '#FBBF24', name: '탐험가' },
  ISFP: { color: '#FBBF24', name: '탐험가' },
  ESTP: { color: '#FBBF24', name: '탐험가' },
  ESFP: { color: '#FBBF24', name: '탐험가' },
};

const LEGENDS = [
  { color: '#EF4444', label: '분석가', desc: 'INT*' },
  { color: '#60A5FA', label: '외교관', desc: 'INF* / ENF*' },
  { color: '#34D399', label: '관리자', desc: 'IS** / ES*J' },
  { color: '#FBBF24', label: '탐험가', desc: 'ES*P / IS*P' },
];

interface Props {
  selected: string;
  onChange: (mbti: string) => void;
}

const Step5MBTI: FC<Props> = ({ selected, onChange }) => {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
        MBTI를 알려주세요
      </h2>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>팀 매칭에 참고할게요</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {MBTI_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {row.map((type) => {
              const isSelected = selected === type;
              const group = MBTI_GROUP[type];
              return (
                <button
                  key={type}
                  onClick={() => onChange(type)}
                  style={{
                    padding: '10px 0',
                    borderRadius: 10,
                    border: isSelected ? '2px solid #F59E0B' : '1px solid #E8DFB8',
                    background: isSelected ? '#FFFBEA' : '#FFFFFF',
                    fontSize: 13,
                    fontWeight: isSelected ? 700 : 400,
                    color: '#111827',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: group.color,
                      flexShrink: 0,
                    }}
                  />
                  {type}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          padding: '12px 16px',
          background: '#F9FAFB',
          borderRadius: 12,
          border: '1px solid #E8DFB8',
        }}
      >
        {LEGENDS.map(({ color, label, desc }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, color: '#374151' }}>
              <strong>{label}</strong> <span style={{ color: '#9CA3AF' }}>({desc})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step5MBTI;
