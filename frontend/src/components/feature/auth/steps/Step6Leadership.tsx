import { type FC } from 'react';

const getLeaderType = (score: number) => {
  if (score <= 20) return { emoji: '🤝', label: '팔로워형' };
  if (score <= 40) return { emoji: '🤝', label: '팔로워 성향' };
  if (score <= 60) return { emoji: '⚖️', label: '밸런스형' };
  if (score <= 80) return { emoji: '👑', label: '리더 성향' };
  return { emoji: '👑', label: '리더형' };
};

interface Props {
  value: number;
  onChange: (score: number) => void;
}

const Step6Leadership: FC<Props> = ({ value, onChange }) => {
  const leaderType = getLeaderType(value);

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
        팀에서의 성향은?
      </h2>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>
        슬라이더를 움직여 표현해주세요
      </p>

      {/* 타입 카드 */}
      <div
        style={{
          width: 140,
          height: 140,
          margin: '0 auto 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFF3C4',
          border: '2px solid #F59E0B',
          borderRadius: 16,
          gap: 10,
        }}
      >
        <span style={{ fontSize: 40 }}>{leaderType.emoji}</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{leaderType.label}</span>
      </div>

      {/* 슬라이더 영역 */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 14, color: '#6B7280' }}>🤝 팔로워</span>
          <span style={{ fontSize: 14, color: '#6B7280' }}>리더 👑</span>
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{
              width: '100%',
              height: 6,
              borderRadius: 999,
              appearance: 'none',
              background: `linear-gradient(to right, #F59E0B ${value}%, #E5E7EB ${value}%)`,
              cursor: 'pointer',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <span
            style={{
              fontSize: 13,
              color: '#92400E',
              background: '#FFF9E6',
              padding: '4px 12px',
              borderRadius: 999,
              border: '1px solid #F3E09A',
            }}
          >
            {value}%
          </span>
        </div>
      </div>

      {/* 슬라이더 thumb 스타일 (global style은 사용 못하니 주석으로 안내) */}
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #F59E0B;
          border: 3px solid #FFFFFF;
          box-shadow: 0 1px 4px rgba(0,0,0,0.18);
          cursor: pointer;
        }
        input[type='range']::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #F59E0B;
          border: 3px solid #FFFFFF;
          box-shadow: 0 1px 4px rgba(0,0,0,0.18);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default Step6Leadership;
