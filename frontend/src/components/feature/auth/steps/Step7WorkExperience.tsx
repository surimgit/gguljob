import { type FC } from 'react';

const WORK_YEARS = [
  { id: 'NEWCOMER', emoji: '🎓', label: '신입', desc: '실무 경험 없음' },
  { id: 'ONE_TO_THREE', emoji: '💼', label: '1~3년', desc: '주니어 레벨' },
  { id: 'FOUR_TO_SIX', emoji: '🚀', label: '4~6년', desc: '미들 레벨' },
  { id: 'MORE_THAN_SEVEN', emoji: '👑', label: '7년 이상', desc: '시니어 레벨' },
];

interface Props {
  selected: string;
  onChange: (value: string) => void;
}

const Step7WorkExperience: FC<Props> = ({ selected, onChange }) => {
  return (
    <div>
      <div style={{ position: 'sticky', top: 0, background: '#FDFBF3', zIndex: 10, paddingBottom: 12, paddingTop: 4 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
          실무 경험이 어느 정도인가요?
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280' }}>채용 공고 필터링에 활용됩니다</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        {WORK_YEARS.map(({ id, emoji, label, desc }) => {
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
                border: `2px solid ${isSelected ? '#F59E0B' : '#E8DFB8'}`,
                background: isSelected ? '#FFFBEA' : '#FFFFFF',
                cursor: 'pointer',
                gap: 14,
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 26 }}>{emoji}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: isSelected ? 600 : 500, color: '#111827' }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>{desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Step7WorkExperience;
