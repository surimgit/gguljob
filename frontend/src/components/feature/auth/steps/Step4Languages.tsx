import { type FC } from 'react';

const LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'Kotlin',
  'Swift',
  'Go',
  'C++',
  'Rust',
  'Ruby',
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
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
        주로 사용하는 언어는?
      </h2>
      <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>여러 개 선택할 수 있어요</p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 20,
        }}
      >
        {LANGUAGES.map((lang) => {
          const isSelected = selected.includes(lang);
          return (
            <button
              key={lang}
              onClick={() => toggle(lang)}
              style={{
                padding: '8px 18px',
                borderRadius: 999,
                border: isSelected ? '2px solid #F59E0B' : '1px solid #E8DFB8',
                background: isSelected ? '#FFFBEA' : '#FFFFFF',
                fontSize: 14,
                fontWeight: isSelected ? 600 : 400,
                color: '#111827',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {lang}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            background: '#FFF9E6',
            borderRadius: 12,
            border: '1px solid #F3E09A',
          }}
        >
          <span style={{ fontSize: 13, color: '#92400E' }}>
            <strong>선택됨:</strong> {selected.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};

export default Step4Languages;
