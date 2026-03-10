import { type FC } from 'react';

const MBTI_ROWS = [
  ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
  ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
  ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
  ['ISTP', 'ISFP', 'ESTP', 'ESFP'],
];

const MBTI_GROUP: Record<string, string> = {
  INTJ: '#EF4444', INTP: '#EF4444', ENTJ: '#EF4444', ENTP: '#EF4444',
  INFJ: '#60A5FA', INFP: '#60A5FA', ENFJ: '#60A5FA', ENFP: '#60A5FA',
  ISTJ: '#34D399', ISFJ: '#34D399', ESTJ: '#34D399', ESFJ: '#34D399',
  ISTP: '#FBBF24', ISFP: '#FBBF24', ESTP: '#FBBF24', ESFP: '#FBBF24',
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
      <div className="sticky top-0 bg-modal-bg z-10 pb-3 pt-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-1.5">MBTI를 알려주세요</h2>
        <p className="text-sm text-gray-500">팀 매칭에 참고할게요</p>
      </div>

      <div className="flex flex-col gap-2 mb-5">
        {MBTI_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-4 gap-2">
            {row.map((type) => {
              const isSelected = selected === type;
              return (
                <button
                  key={type}
                  onClick={() => onChange(type)}
                  className={`py-2.5 rounded-[10px] text-[13px] transition-all duration-150 cursor-pointer flex items-center justify-center gap-1 border-2
                    ${isSelected
                      ? 'border-accent bg-amber-50 font-bold text-gray-900'
                      : 'border-border-warm bg-white font-normal text-gray-900'
                    }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: MBTI_GROUP[type] }}
                  />
                  {type}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-2.5 px-4 py-3 bg-gray-50 rounded-xl border border-border-warm">
        {LEGENDS.map(({ color, label, desc }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-[12px] text-gray-700">
              <strong>{label}</strong>{' '}
              <span className="text-gray-400">({desc})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step5MBTI;
