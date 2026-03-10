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
      <div className="sticky top-0 bg-modal-bg z-10 pb-3 pt-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-1.5">목표가 무엇인가요?</h2>
        <p className="text-sm text-gray-500">복수 선택이 가능해요</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {GOALS.map((goal) => {
          const isSelected = selected.includes(goal.id);
          return (
            <button
              key={goal.id}
              onClick={() => toggle(goal.id)}
              className={`flex flex-col items-center justify-center py-5 px-3 rounded-2xl transition-all duration-150 cursor-pointer gap-2 border-2
                ${isSelected ? 'border-accent bg-amber-50' : 'border-border-warm bg-white'}`}
            >
              <span className="text-3xl">{goal.emoji}</span>
              <span className={`text-sm ${isSelected ? 'font-semibold' : 'font-normal'} text-gray-900`}>
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
