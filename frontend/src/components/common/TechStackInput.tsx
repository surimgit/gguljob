import { useState, useRef } from 'react';
import { X } from 'lucide-react';

const CATEGORIES = {
  FE: ['React', 'Vue.js', 'Next.js', 'TypeScript', 'JavaScript', 'HTML/CSS', 'jQuery', 'Swift'],
  BE: ['Spring Boot', 'Java', 'Python', 'Node.js', 'Django', 'FastAPI', 'Flask', 'Nest.js', 'Kotlin', 'C', 'C++', 'C#', 'PHP', '.NET', 'JPA', 'MyBatis', 'MSA'],
  DB: ['MySQL', 'PostgreSQL', 'MongoDB', 'MariaDB', 'Oracle DB', 'MSSQL', 'Redis'],
  Infra: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Jenkins', 'Nginx', 'Linux', 'Git', 'Kafka', 'Airflow'],
  AI: ['AI', 'PyTorch', 'TensorFlow', 'OpenCV', 'RAG', 'LLM', 'MLOps', 'Hadoop'],
  Mobile: ['React Native', 'Flutter', 'Android', 'iOS', 'Kotlin', 'Unity'],
  Tools: ['Jira', 'Figma'],
} as const;

type Category = keyof typeof CATEGORIES;

const ALL_STACKS = [...new Set(Object.values(CATEGORIES).flat())];

interface Props {
  value: string[];
  onChange: (stacks: string[]) => void;
}

const TechStackInput = ({ value, onChange }: Props) => {
  const [activeCategory, setActiveCategory] = useState<Category>('FE');
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  const suggestions = input.trim()
    ? ALL_STACKS.filter(
        (s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s)
      )
    : [];

  const add = (stack: string) => {
    if (!value.includes(stack)) onChange([...value, stack]);
    setInput('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const remove = (stack: string) => onChange(value.filter((s) => s !== stack));

  return (
    <div className="flex flex-col gap-3">
      {/* 선택된 태그 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((stack) => (
            <span
              key={stack}
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-border bg-white text-sm text-text-primary whitespace-nowrap"
            >
              {stack}
              <button type="button" onClick={() => remove(stack)}>
                <X className="w-3 h-3 text-text-tertiary hover:text-text-secondary" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 카테고리 탭 */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {(Object.keys(CATEGORIES) as Category[]).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-text-primary'
                : 'bg-background text-text-secondary hover:bg-primary-soft'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 추천 칩 */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES[activeCategory].map((stack) => {
          const selected = value.includes(stack);
          return (
            <button
              key={stack}
              type="button"
              onClick={() => (selected ? remove(stack) : add(stack))}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                selected
                  ? 'border-primary bg-primary-soft text-text-primary font-medium'
                  : 'border-border bg-white text-text-secondary hover:border-primary hover:bg-primary-soft'
              }`}
            >
              {stack}
            </button>
          );
        })}
      </div>

      {/* 직접 입력 */}
      <div className="relative">
        <input
          type="text"
          value={input}
          placeholder="직접 입력 후 Enter"
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
            setHighlightedIndex(-1);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightedIndex((prev) => {
                const next = Math.min(prev + 1, suggestions.length - 1);
                listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
                return next;
              });
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightedIndex((prev) => {
                const next = Math.max(prev - 1, 0);
                listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
                return next;
              });
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                add(suggestions[highlightedIndex]);
              } else if (input.trim()) {
                add(input.trim());
              }
            } else if (e.key === 'Escape') {
              setShowSuggestions(false);
              setHighlightedIndex(-1);
            }
          }}
          className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul
            ref={listRef}
            className="absolute top-full mt-1 w-full bg-white border border-border rounded-xl shadow-md z-10 max-h-40 overflow-y-auto"
          >
            {suggestions.map((s, idx) => (
              <li
                key={s}
                onMouseDown={() => add(s)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`px-4 py-2 text-sm text-text-primary cursor-pointer transition-colors ${
                  idx === highlightedIndex ? 'bg-primary-soft' : 'hover:bg-primary-soft'
                }`}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TechStackInput;
