import { type FC } from 'react';

const GOALS = [
  { id: 'side-project', emoji: '🚀', label: '사이드 프로젝트' },
  { id: 'portfolio', emoji: '💼', label: '포트폴리오' },
  { id: 'study', emoji: '📚', label: '스터디' },
  { id: 'startup', emoji: '💡', label: '창업 준비' },
  { id: 'competition', emoji: '🏆', label: '공모전' },
  { id: 'job', emoji: '🎯', label: '취업 준비' },
];

interface Props {
  selected: string[];
  onChange: (goals: string[]) => void;
}

const Step1Goals: FC<Props> = ({ selected, onChange }) => {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((g) => g !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
        목표가 무엇인가요?
      </h2>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>복수 선택이 가능해요</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        {GOALS.map((goal) => {
          const isSelected = selected.includes(goal.id);
          return (
            <button
              key={goal.id}
              onClick={() => toggle(goal.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 12px',
                borderRadius: 16,
                border: isSelected ? '2px solid #F59E0B' : '1px solid #E8DFB8',
                background: isSelected ? '#FFFBEA' : '#FFFFFF',
                cursor: 'pointer',
                gap: 8,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 28 }}>{goal.emoji}</span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: isSelected ? 600 : 400,
                  color: '#111827',
                }}
              >
                {goal.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Step1Goals;
