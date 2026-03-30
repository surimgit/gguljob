import { useState, useRef, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { getSkills, type SkillDto } from '../../api/skill';
import { SKILL_CATEGORY_META, SKILLS } from '../../constants/skills';

const CATEGORY_ORDER = Object.fromEntries(SKILL_CATEGORY_META.map((m, i) => [m.key, i]));
const SKILL_ORDER = Object.fromEntries(SKILLS.map((s, i) => [s.name, i]));

interface Props {
  value: string[];
  onChange: (stacks: string[]) => void;
}

const TechStackInput = ({ value, onChange }: Props) => {
  const [skillsByCategory, setSkillsByCategory] = useState<Record<string, SkillDto[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    getSkills()
      .then((data) => {
        setSkillsByCategory(data.categories);
        const firstCategory = Object.keys(data.categories)[0] ?? '';
        setActiveCategory(firstCategory);
      })
      .catch((e) => console.error('Failed to fetch skills:', e))
      .finally(() => setIsLoading(false));
  }, []);

  const categoryTabs = useMemo(
    () => Object.keys(skillsByCategory).sort(
      (a, b) => (CATEGORY_ORDER[a] ?? 999) - (CATEGORY_ORDER[b] ?? 999)
    ),
    [skillsByCategory],
  );

  const activeSkills = useMemo(
    () => [...(skillsByCategory[activeCategory] ?? [])].sort(
      (a, b) => (SKILL_ORDER[a.name] ?? 999) - (SKILL_ORDER[b.name] ?? 999)
    ).map((s) => s.name),
    [skillsByCategory, activeCategory],
  );

  const allSkillNames = useMemo(
    () => Object.values(skillsByCategory).flat().map((s) => s.name),
    [skillsByCategory],
  );

  const suggestions = input.trim()
    ? allSkillNames.filter(
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
    <div className="flex flex-col gap-4">
      {/* 선택된 태그 */}
      {value.length > 0 && (
        <>
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
          <hr className="border-border" />
        </>
      )}

      {/* 카테고리 탭 */}
      <div className="flex gap-1 flex-wrap">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-16 h-7 rounded-full bg-gray-200 animate-pulse" />
        )) : categoryTabs.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === category
                ? 'bg-primary text-text-primary'
                : 'bg-background text-text-secondary hover:bg-primary-soft'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 추천 칩 */}
      <div className="flex flex-wrap gap-2">
        {!isLoading && activeSkills.length > 0 && (
          <button
            type="button"
            onClick={() => {
              const allSelected = activeSkills.every((s) => value.includes(s));
              if (allSelected) {
                onChange(value.filter((s) => !activeSkills.includes(s)));
              } else {
                onChange([...value, ...activeSkills.filter((s) => !value.includes(s))]);
              }
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-full border border-primary text-text-primary bg-primary-soft hover:bg-primary hover:text-white transition-colors whitespace-nowrap"
          >
            {activeSkills.every((s) => value.includes(s)) ? '전체 해제' : '전체 선택'}
          </button>
        )}
        {activeSkills.map((stack) => {
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
