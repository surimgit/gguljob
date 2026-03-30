import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, ExternalLink, Lightbulb, Code2 } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const detectLang = (code: string): string => {
  if (/@(Controller|Service|Repository|SpringBootApplication|RestController|GetMapping|PostMapping|PatchMapping|PutMapping|DeleteMapping|RequestBody|RequestPart|Autowired|Component|Bean|Configuration)\b/.test(code)) return 'java';
  if (/\bdef\s+\w+\s*\(|import\s+\w+|print\(/.test(code)) return 'python';
  if (/\bfun\s+\w+\s*\(|val\s|var\s/.test(code) && !/function/.test(code)) return 'kotlin';
  if (/<\/?[a-z][\w-]*[\s/>]/.test(code) && /className|onClick/.test(code)) return 'tsx';
  if (/const\s|let\s|=>\s*\{|import\s.*from/.test(code)) return 'typescript';
  if (/SELECT|INSERT|UPDATE|DELETE|FROM|WHERE/i.test(code)) return 'sql';
  if (/^(---|\s*-\s|\w+:)/.test(code)) return 'yaml';
  return 'java';
};

// ── 타입 ──────────────────────────────────────────────────────────────────────
interface TroubleshootingCardItem {
  id: number;
  title: string;
  description: string;
  solution: string | null;
  codeSnippet: string | null;
  date: string;
  projectId: number;
  projectName: string;
}

// ── 뱃지 색상 풀 ─────────────────────────────────────────────────────────────
const BADGE_COLORS = [
  { bg: '#EDE9FE', text: '#7C3AED' },
  { bg: '#DBEAFE', text: '#2563EB' },
  { bg: '#D1FAE5', text: '#059669' },
  { bg: '#FEF3C7', text: '#D97706' },
  { bg: '#FFE4E6', text: '#E11D48' },
  { bg: '#E0E7FF', text: '#4338CA' },
  { bg: '#CCFBF1', text: '#0D9488' },
  { bg: '#FCE7F3', text: '#DB2777' },
];

const getBadgeColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
};

// ── 카드 컴포넌트 ─────────────────────────────────────────────────────────────
const TroubleshootingCard = ({ item }: { item: TroubleshootingCardItem }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const badgeColor = getBadgeColor(item.projectName);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const handleGoToProject = () => {
    navigate(`/my-projects/${item.projectId}?tab=personal&subtab=troubleshooting`);
  };

  return (
    <div className="bg-surface rounded-2xl px-6 py-5 flex flex-col gap-2 shadow-[2px_2px_8px_0px_rgba(0,0,0,0.08)] transition-all duration-200">
      {/* 상단: 프로젝트 뱃지 + 제목 + 날짜 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="px-2.5 py-1 rounded-full text-sm font-bold whitespace-nowrap shrink-0"
            style={{ backgroundColor: badgeColor.bg, color: badgeColor.text }}
          >
            {item.projectName}
          </span>
          <h3 className="text-lg font-bold text-text-primary leading-snug truncate">
            {item.title}
          </h3>
        </div>
        <span className="text-sm text-text-tertiary whitespace-nowrap shrink-0">{item.date}</span>
      </div>

      {/* 설명 미리보기 + 더 보기 */}
      <div className="flex items-end gap-2">
        <p className="text-base text-text-secondary leading-relaxed flex-1 line-clamp-2">
          {item.description}
        </p>
        <button
          onClick={handleToggle}
          className="flex items-center gap-0.5 text-sm text-text-tertiary hover:text-primary font-semibold whitespace-nowrap shrink-0 transition-colors"
        >
          {expanded ? '접기' : '더 보기'}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── 펼침 영역: 디자인 시안 스타일 ── */}
      {expanded && (
        <div className="mt-3 pt-4 border-t border-border flex flex-col gap-5">

          {/* 해결 방법 */}
          {item.solution && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-[#10B981]" />
                <span className="text-base font-bold text-text-primary">해결 방법</span>
              </div>
              <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <p className="text-base text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {item.solution}
                </p>
              </div>
            </div>
          )}

          {/* 주요 코드 */}
          {item.codeSnippet && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-[#6366F1]" />
                <span className="text-base font-bold text-text-primary">주요 코드</span>
              </div>
              <SyntaxHighlighter
                language={detectLang(item.codeSnippet)}
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{ margin: 0, borderRadius: '12px', fontSize: '15px', lineHeight: '1.75', padding: '20px 24px' }}
                lineNumberStyle={{ color: '#555', minWidth: '2.5em', paddingRight: '1.2em', userSelect: 'none' }}
              >
                {item.codeSnippet}
              </SyntaxHighlighter>
            </div>
          )}

          {/* 프로젝트에서 보기 링크 */}
          <button
            onClick={handleGoToProject}
            className="self-end flex items-center gap-1.5 text-sm font-semibold text-text-tertiary hover:text-primary transition-colors"
          >
            프로젝트에서 보기
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export type { TroubleshootingCardItem };
export default TroubleshootingCard;
