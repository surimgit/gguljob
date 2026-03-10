import { type FC } from 'react';

const LEVELS = [
  { id: 'beginner', emoji: '🌱', label: '입문', period: '6개월 미만' },
  { id: 'junior', emoji: '🌿', label: '초급', period: '6개월 ~ 1년' },
  { id: 'mid', emoji: '🌳', label: '중급', period: '1 ~ 3년' },
  { id: 'senior', emoji: '🏔', label: '고급', period: '3년 이상' },
];

interface Props {
  selected: string;
  onChange: (experience: string) => void;
}

const Step3Experience: FC<Props> = ({ selected, onChange }) => {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
        개발 경험이 어느 정도인가요?
      </h2>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>해당되는 수준을 선택해주세요</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {LEVELS.map(({ id, emoji, label, period }) => {
          const isSelected = selected === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: 16,
                border: isSelected ? '2px solid #F59E0B' : '1px solid #E8DFB8',
                background: isSelected ? '#FFFBEA' : '#FFFFFF',
                cursor: 'pointer',
                gap: 14,
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 26 }}>{emoji}</span>
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: isSelected ? 600 : 500,
                    color: '#111827',
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{period}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Step3Experience;
