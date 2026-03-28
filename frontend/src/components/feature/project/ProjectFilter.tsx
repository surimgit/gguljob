import { useState } from 'react';
import { Search } from 'lucide-react';
import type { SkillGroup } from '../../../api/projects';
import { ROLE_LIST, ROLE_DISPLAY_NAMES, SKILL_NAMES } from '../../../constants/skills';

export interface ProjectFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  techFilter: string[];
  domainFilter: string;
  positionFilter: string;
  onTechChange: (value: string[]) => void;
  onDomainChange: (value: string) => void;
  onPositionChange: (value: string) => void;
  skillGroups?: SkillGroup[];
  domainOptions?: string[];
  positionOptions?: string[];
}

const DEFAULT_DOMAIN_OPTIONS = ['웹기술', '웹디자인', '모바일', 'AIoT', '인공지능', '빅데이터', '블록체인', '자율주행', '핀테크', '메타버스'];
const DEFAULT_POSITION_OPTIONS = ROLE_LIST.map((role) => `${ROLE_DISPLAY_NAMES[role]} 모집중`);

interface FilterRowProps {
  label: string;
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

function FilterButton({ text, selected, onClick }: { text: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        selected
          ? 'h-[31.5px] px-[16px] rounded-[20px] font-bold text-[#111827] text-[13px] shadow-[0px_2px_8px_0px_rgba(245,200,66,0.3)] whitespace-nowrap transition-all'
          : 'h-[31.5px] px-[16px] rounded-[20px] font-bold text-[#9ca3af] text-[13px] whitespace-nowrap hover:text-[#111827] transition-all'
      }
      style={
        selected
          ? { backgroundImage: 'linear-gradient(150.6deg, #F7C948 0%, #F2B705 100%)' }
          : {}
      }
    >
      {text}
    </button>
  );
}

function FilterRow({ label, options, selected, onChange }: FilterRowProps) {
  return (
    <div className="flex items-start min-h-[32px] relative w-full">
      <span className="font-bold text-[#111827] text-[13px] leading-[31.5px] w-[56px] shrink-0">
        {label}
      </span>
      <div className="flex items-center ml-[12px] flex-wrap gap-y-[4px]">
        {options.map((option) => (
          <FilterButton
            key={option}
            text={option}
            selected={selected === option}
            onClick={() => onChange(option)}
          />
        ))}
      </div>
    </div>
  );
}

function SkillFilterRow({
  groups,
  selected,
  onChange,
}: {
  groups: SkillGroup[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const activeGroup = groups.find((g) => g.category === activeCategory);
  const skills = activeGroup?.skills ?? [];

  const toggleSkill = (skill: string) => {
    if (selected.includes(skill)) {
      onChange(selected.filter((s) => s !== skill));
    } else {
      onChange([...selected, skill]);
    }
  };

  return (
    <div className="flex flex-col gap-[8px]">
      {/* 카테고리 탭 */}
      <div className="flex items-start min-h-[32px] relative w-full">
        <span className="font-bold text-[#111827] text-[13px] leading-[31.5px] w-[56px] shrink-0">
          기술스택
        </span>
        <div className="flex items-center ml-[12px] flex-wrap gap-y-[4px]">
          <FilterButton
            text="전체"
            selected={selected.length === 0 && activeCategory === null}
            onClick={() => { setActiveCategory(null); onChange([]); }}
          />
          {groups.map((group) => (
            <FilterButton
              key={group.category}
              text={group.label}
              selected={activeCategory === group.category}
              onClick={() => setActiveCategory(activeCategory === group.category ? null : group.category)}
            />
          ))}
        </div>
      </div>

      {/* 선택된 카테고리의 스킬 목록 */}
      {activeCategory && skills.length > 0 && (
        <>
          <div className="ml-[68px] border-t border-dashed border-[#e0d3b8]" />
          <div className="flex items-start min-h-[32px] relative w-full">
            <span className="font-bold text-[#b8a88a] text-[12px] leading-[31.5px] w-[56px] shrink-0 text-right pr-[4px]">
              {activeGroup?.label}
            </span>
            <div className="flex items-center ml-[12px] flex-wrap gap-y-[4px] flex-1">
              {skills.map((skill) => (
                <FilterButton
                  key={skill}
                  text={skill}
                  selected={selected.includes(skill)}
                  onClick={() => toggleSkill(skill)}
                />
              ))}
              <FilterButton
                text={skills.every((s) => selected.includes(s)) ? '전체 해제' : '전체 선택'}
                selected={skills.every((s) => selected.includes(s))}
                onClick={() => {
                  const allSelected = skills.every((s) => selected.includes(s));
                  if (allSelected) {
                    onChange(selected.filter((s) => !skills.includes(s)));
                  } else {
                    onChange([...selected, ...skills.filter((s) => !selected.includes(s))]);
                  }
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ProjectFilter({
  searchQuery,
  onSearchChange,
  techFilter,
  domainFilter,
  positionFilter,
  onTechChange,
  onDomainChange,
  onPositionChange,
  skillGroups,
  domainOptions,
  positionOptions,
}: ProjectFilterProps) {
  const domains = ['전체', ...(domainOptions ?? DEFAULT_DOMAIN_OPTIONS)];
  const positions = ['전체', ...(positionOptions ?? DEFAULT_POSITION_OPTIONS)];

  return (
    <div className="flex flex-col gap-[24px]">

      {/* 검색바 */}
      <div className="bg-[#FFFDF9] border-2 border-[#e5e7eb] rounded-[18px] h-[62px] flex items-center px-[25px] gap-[12px]">
        <Search className="w-[24px] h-[24px] text-[#9ca3af] shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="프로젝트명으로 검색하세요"
          className="flex-1 bg-transparent font-normal text-[13px] text-black placeholder:text-[#9ca3af] outline-none"
        />
      </div>

      {/* 필터 박스 */}
      <div className="bg-[#f7f8fa] border-2 border-[#f2b705] rounded-[18px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.02)] px-[25px] pt-[20px] pb-[14px] flex flex-col gap-[12px]">
        <FilterRow
          label="도메인"
          options={domains}
          selected={domainFilter}
          onChange={onDomainChange}
        />

        <div className="bg-[#f2b705] h-px w-full" />

        <FilterRow
          label="포지션"
          options={positions}
          selected={positionFilter}
          onChange={onPositionChange}
        />

        <div className="bg-[#f2b705] h-px w-full" />

        {skillGroups && skillGroups.length > 0 ? (
          <SkillFilterRow
            groups={skillGroups}
            selected={techFilter}
            onChange={onTechChange}
          />
        ) : (
          <FilterRow
            label="기술스택"
            options={['전체', ...SKILL_NAMES]}
            selected={techFilter.length === 0 ? '전체' : techFilter[0]}
            onChange={(v) => onTechChange(v === '전체' ? [] : [v])}
          />
        )}

      </div>
    </div>
  );
}
