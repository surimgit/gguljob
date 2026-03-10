import { type FC } from 'react';

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Kotlin',
  'Swift', 'Go', 'C++', 'Rust', 'Ruby',
];

interface Props {
  selected: string[];
  onChange: (languages: string[]) => void;
}

const Step4Languages: FC<Props> = ({ selected, onChange }) => {
  const toggle = (lang: string) => {
    if (selected.includes(lang)) {
      onChange(selected.filter((l) => l !== lang));
    } else {
      onChange([...selected, lang]);
    }
  };

  return (
    <div>
      <div className="sticky top-0 bg-modal-bg z-10 pb-3 pt-1">
        <h2 className="text-2xl font-bold text-gray-900 mb-1.5">주로 사용하는 언어는?</h2>
        <p className="text-sm text-gray-500">여러 개 선택할 수 있어요</p>
      </div>

      <div className="flex flex-wrap gap-2.5 mb-5">
        {LANGUAGES.map((lang) => {
          const isSelected = selected.includes(lang);
          return (
            <button
              key={lang}
              onClick={() => toggle(lang)}
              className={`py-2 px-[18px] rounded-full text-sm transition-all duration-150 cursor-pointer border-2
                ${isSelected
                  ? 'border-accent bg-amber-50 font-semibold text-gray-900'
                  : 'border-border-warm bg-white font-normal text-gray-900'
                }`}
            >
              {lang}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="px-4 py-3 bg-[#FFF9E6] rounded-xl border border-[#F3E09A]">
          <span className="text-[13px] text-amber-800">
            <strong>선택됨:</strong> {selected.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};

export default Step4Languages;
