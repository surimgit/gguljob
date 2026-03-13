import { Search } from 'lucide-react';

export interface ProjectFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  techFilter: string;
  domainFilter: string;
  positionFilter: string;
  onTechChange: (value: string) => void;
  onDomainChange: (value: string) => void;
  onPositionChange: (value: string) => void;
}

const TECH_OPTIONS = [
  '전체', 'React', 'TypeScript', 'Spring Boot',
  'Python', 'Node.js', 'Vue.js', 'Next.js', 'Neo4j',
];

const DOMAIN_OPTIONS = [
  '전체', '웹기술', '웹디자인', '모바일',
  'AIoT', '인공지능', '빅데이터', '블록체인',
  '자율주행', '핀테크', '메타버스',
];

const POSITION_OPTIONS = ['전체', 'FE 모집중', 'BE 모집중'];

interface FilterRowProps {
  label: string;
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

function FilterRow({ label, options, selected, onChange }: FilterRowProps) {
  return (
    <div className="flex items-start min-h-[32px] relative w-full">
      <span className="font-bold text-[#111827] text-[13px] leading-[31.5px] w-[56px] shrink-0">
        {label}
      </span>
      <div className="flex items-center ml-[12px] flex-wrap gap-y-[4px]">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={
              selected === option
                ? 'h-[31.5px] px-[16px] rounded-[20px] font-bold text-[#111827] text-[13px] shadow-[0px_2px_8px_0px_rgba(245,200,66,0.3)] whitespace-nowrap transition-all'
                : 'h-[31.5px] px-[16px] rounded-[20px] font-bold text-[#9ca3af] text-[13px] whitespace-nowrap hover:text-[#111827] transition-all'
            }
            style={
              selected === option
                ? { backgroundImage: 'linear-gradient(150.6deg, #F7C948 0%, #F2B705 100%)' }
                : {}
            }
          >
            {option}
          </button>
        ))}
      </div>
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
}: ProjectFilterProps) {
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
          label="기술스택"
          options={TECH_OPTIONS}
          selected={techFilter}
          onChange={onTechChange}
        />

        <div className="bg-[#f2b705] h-px w-full" />

        <FilterRow
          label="도메인"
          options={DOMAIN_OPTIONS}
          selected={domainFilter}
          onChange={onDomainChange}
        />

        <div className="bg-[#f2b705] h-px w-full" />

        <FilterRow
          label="포지션"
          options={POSITION_OPTIONS}
          selected={positionFilter}
          onChange={onPositionChange}
        />

      </div>
    </div>
  );
}
