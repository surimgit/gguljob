import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FolderOpen, CheckCircle2, Sparkles, Copy, Check, RotateCcw } from 'lucide-react';
import chatbotImg from '../assets/images/chatbot.png';

// ── 더미 마크다운 결과 ────────────────────────────────────────────────────────
const MOCK_PORTFOLIO_MD = `# 프론트엔드 개발자 포트폴리오

## 프로젝트 개요

### DevLog 트러블슈팅 플랫폼
- **기간**: 2026.01 ~ 진행중
- **역할**: Frontend Developer
- **기술 스택**: React, TypeScript, Spring Boot

---

## 트러블슈팅 경험

### 1. SSR 환경 마크다운 렌더링 window 오류

**문제 상황**
react-markdown과 rehype-highlight를 적용하는 과정에서 SSR 환경에서 \`window is not defined\` 오류가 발생했습니다.

**해결 과정**
- SSR에서 브라우저 전용 API를 사용하는 라이브러리의 동작 방식을 분석
- \`next/dynamic\`의 \`ssr: false\` 옵션을 활용하여 클라이언트 사이드에서만 렌더링되도록 처리

\`\`\`typescript
const ReactMarkdown = dynamic(
  () => import('react-markdown'),
  { ssr: false }
)
\`\`\`

**성과**: SSR 빌드 에러 해결 및 마크다운 렌더링 안정화

### 2. 무한 스크롤 Race Condition 해결

**문제 상황**
Intersection Observer 기반 무한 스크롤에서 중복 호출로 인한 Race Condition이 발생하여 동일한 데이터가 두 번 렌더링되는 문제가 있었습니다.

**해결 과정**
- \`useRef\`로 \`isFetching\` 플래그를 관리하여 중복 요청을 방지
- Observer 콜백 내에서 플래그 체크 로직 추가

\`\`\`typescript
const isFetching = useRef(false)
if (!isFetching.current) {
  isFetching.current = true
  await fetchNextPage()
  isFetching.current = false
}
\`\`\`

**성과**: 중복 API 호출 제거 및 안정적인 무한 스크롤 구현

---

## 핵심 역량
- **문제 해결**: SSR/CSR 환경 차이를 이해하고 적절한 해결책 적용
- **성능 최적화**: Race Condition 분석 및 효율적인 상태 관리 구현
- **기술 학습**: 새로운 라이브러리 도입 시 발생하는 이슈를 체계적으로 분석하고 문서화
`;

// ── 타입 ──────────────────────────────────────────────────────────────────────
interface ProjectItem {
  id: number;
  title: string;
  teamName: string;
  domain: string;
  status: 'PROCEEDING' | 'RECRUITING' | 'DONE';
  skills: string[];
}

interface TroubleshootingItem {
  id: number;
  projectId: number;
  title: string;
  problemDesc: string;
  solutionDesc: string;
}

// ── 더미 데이터 ───────────────────────────────────────────────────────────────
const MOCK_PROJECTS: ProjectItem[] = [
  { id: 1, title: 'DevLog 트러블슈팅 플랫폼', teamName: 'S14P21E107', domain: '웹 풀스택', status: 'PROCEEDING', skills: ['React', 'TypeScript', 'Spring Boot'] },
  { id: 2, title: '실시간 협업 화이트보드', teamName: 'S14P11A203', domain: '웹 풀스택', status: 'RECRUITING', skills: ['Vue.js', 'WebSocket', 'Spring Boot'] },
  { id: 3, title: 'AI 코드 리뷰 어시스턴트', teamName: 'S13P31B102', domain: 'AI/ML', status: 'DONE', skills: ['Next.js', 'Python', 'FastAPI'] },
];

const MOCK_TROUBLESHOOTINGS: TroubleshootingItem[] = [
  { id: 1, projectId: 1, title: 'SSR 환경 마크다운 렌더링 window 오류', problemDesc: 'react-markdown + rehype-highlight 적용 시 SSR에서 window is not defined 오류 발생.', solutionDesc: 'next/dynamic으로 SSR 비활성화' },
  { id: 2, projectId: 1, title: '무한 스크롤 Race Condition 해결', problemDesc: 'Intersection Observer 중복 호출로 Race Condition 발생.', solutionDesc: 'useRef로 isFetching 플래그 관리' },
  { id: 3, projectId: 2, title: 'WebSocket 재연결 로직 구현', problemDesc: '네트워크 불안정 시 WebSocket 연결이 끊어지면 자동 재연결되지 않음.', solutionDesc: 'exponential backoff 재연결 로직 구현' },
  { id: 4, projectId: 3, title: 'OpenAI API Rate Limit 처리', problemDesc: '동시 요청 시 429 Too Many Requests 에러 발생.', solutionDesc: 'Queue 기반 요청 제한 및 retry 로직 추가' },
];

const CIRCLE_COLORS = ['#E11D48', '#2563EB', '#16A34A', '#E8B931', '#9333EA', '#F97316', '#0EA5E9', '#6D28D9'];

// ── 프로젝트 카드 ─────────────────────────────────────────────────────────────
const ProjectCard = ({ project, active, hasSelectedTs, onToggle }: { project: ProjectItem; active: boolean; hasSelectedTs: boolean; onToggle: () => void }) => {
  const isActive = project.status !== 'DONE';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={hasSelectedTs}
      className={`rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition-all text-left w-full ${
        hasSelectedTs
          ? 'border-2 border-primary-hover bg-primary-soft shadow-md'
          : active
            ? 'border-2 border-primary-hover bg-surface shadow-sm'
            : 'border-2 border-border bg-surface hover:shadow-md'
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-bold" style={{ color: 'var(--color-amber)' }}>
          {project.domain}
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: isActive ? 'var(--color-success-dark)' : 'var(--color-text-tertiary)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isActive ? 'var(--color-success-dark)' : 'var(--color-text-tertiary)' }} />
            {project.status === 'RECRUITING' ? '모집중' : project.status === 'PROCEEDING' ? '진행중' : '완료'}
          </span>
          {hasSelectedTs && <CheckCircle2 className="w-5 h-5 text-primary-hover" />}
        </div>
      </div>

      {/* 본문 */}
      <div>
        <h3 className="text-base font-bold text-text-primary">{project.title}</h3>
        <p className="text-sm text-text-secondary mt-1">{project.teamName}</p>
      </div>

      {/* 기술 스택 */}
      <div className="flex flex-wrap gap-1.5">
        {project.skills.map((stack) => (
          <span
            key={stack}
            className="px-2.5 py-0.5 rounded-full border text-[11px] font-medium"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-background)' }}
          >
            {stack}
          </span>
        ))}
      </div>
    </button>
  );
};

// ── 트러블슈팅 카드 ──────────────────────────────────────────────────────────
const TsCard = ({ item, selected, onToggle }: { item: TroubleshootingItem; selected: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={selected}
    className={`flex flex-col border-2 rounded-2xl overflow-hidden cursor-pointer transition-all text-left w-full ${
      selected
        ? 'border-primary-hover bg-primary-soft shadow-md'
        : 'border-border bg-surface hover:shadow-md'
    }`}
  >
    <div className="flex items-center gap-3 px-4 py-4 w-full">
      <span
        className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: CIRCLE_COLORS[(item.id - 1) % CIRCLE_COLORS.length] }}
      >
        {item.id}
      </span>
      <h4 className="text-sm font-bold text-text-primary leading-snug flex-1">{item.title}</h4>
      {selected && <CheckCircle2 className="w-5 h-5 text-primary-hover flex-shrink-0" />}
    </div>
    <div className="flex flex-col gap-1 px-4 pb-4 border-t border-border pt-3 w-full" style={{ background: '#FAF9F6' }}>
      <p className="text-xs font-bold text-text-primary">문제 상황</p>
      <p className="text-xs text-text-secondary leading-relaxed">{item.problemDesc}</p>
      <p className="text-xs font-bold text-text-primary mt-2">해결 방법</p>
      <p className="text-xs text-text-secondary leading-relaxed">{item.solutionDesc}</p>
    </div>
  </button>
);

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
const PortfolioCreate = () => {
  const navigate = useNavigate();
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [selectedTs, setSelectedTs] = useState<number[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedMd, setGeneratedMd] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const generateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (generateTimerRef.current) clearTimeout(generateTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const toggleProject = (id: number) => {
    // 항상 해당 프로젝트의 트러블슈팅 목록을 보여줌
    setActiveProject(id);
    if (!selectedProjects.includes(id)) {
      setSelectedProjects((prev) => [...prev, id]);
    }
  };

  const toggleTs = (id: number) => {
    setSelectedTs((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  // 현재 활성 프로젝트의 트러블슈팅만 표시
  const filteredTs = MOCK_TROUBLESHOOTINGS.filter((ts) =>
    ts.projectId === activeProject
  );

  const handleGenerate = () => {
    setGenerating(true);
    // TODO: 실제 API 연결 시 이 setTimeout을 교체
    generateTimerRef.current = setTimeout(() => {
      setGenerating(false);
      setGeneratedMd(MOCK_PORTFOLIO_MD);
    }, 2000);
  };

  const handleCopy = () => {
    if (!generatedMd) return;
    navigator.clipboard.writeText(generatedMd);
    setCopied(true);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGeneratedMd(null);
    setCopied(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 flex flex-col gap-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">포트폴리오 생성</h1>
      </div>

      {generatedMd ? (
        <div className="grid grid-cols-3 gap-6 items-start">
          {/* Step3: AI 포트폴리오 생성 (왼쪽) */}
          <div className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#6366f1]">Step 3.</span>
              <h2 className="text-lg font-bold text-text-primary">AI 포트폴리오 생성</h2>
            </div>
            <p className="text-sm text-text-secondary -mt-2">선택한 트러블슈팅을 기반으로 포트폴리오를 생성합니다</p>

            {/* 선택 요약 */}
            <div className="flex flex-col gap-3 bg-[#FAF9F6] rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-text-primary">선택된 프로젝트</span>
                <span className="text-sm font-bold text-[#6366f1]">{selectedProjects.length}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-text-primary">선택된 트러블슈팅</span>
                <span className="text-sm font-bold text-[#6366f1]">{selectedTs.length}개</span>
              </div>
            </div>

            {/* 선택된 트러블슈팅 목록 */}
            {selectedTs.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-text-primary">포함된 트러블슈팅</span>
                <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto">
                  {selectedTs.map((tsId) => {
                    const ts = MOCK_TROUBLESHOOTINGS.find((t) => t.id === tsId);
                    if (!ts) return null;
                    return (
                      <div
                        key={ts.id}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#eef2ff] border border-[#c7d2fe]"
                      >
                        <span
                          className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: CIRCLE_COLORS[(ts.id - 1) % CIRCLE_COLORS.length] }}
                        >
                          {ts.id}
                        </span>
                        <span className="text-xs text-text-secondary truncate">{ts.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 다시 선택 버튼 */}
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 mt-auto rounded-xl text-sm font-bold border border-border bg-white hover:bg-background transition-colors text-text-secondary flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              다시 선택하기
            </button>
          </div>

          {/* 결과 섹션 (오른쪽 2칸) */}
          <div className="col-span-2 flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#6366f1]">Result.</span>
                <h2 className="text-lg font-bold text-text-primary">AI 포트폴리오 결과</h2>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-border bg-white hover:bg-background transition-colors text-text-secondary"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
            <div className="bg-[#FAF9F6] border border-border rounded-xl p-6 overflow-auto max-h-[70vh]">
              <pre className="whitespace-pre-wrap text-sm text-text-primary leading-relaxed font-mono">{generatedMd}</pre>
            </div>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-3 gap-6 items-start">
        {/* 섹션 1: 프로젝트 선택 */}
        <div className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-primary-hover">Step 1.</span>
            <h2 className="text-lg font-bold text-text-primary">프로젝트 선택</h2>
          </div>
          <p className="text-sm text-text-secondary -mt-2">포트폴리오에 포함할 프로젝트를 선택하세요</p>
          <div className="flex flex-col gap-3">
            {MOCK_PROJECTS.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                active={activeProject === project.id}
                hasSelectedTs={MOCK_TROUBLESHOOTINGS.some((ts) => ts.projectId === project.id && selectedTs.includes(ts.id))}
                onToggle={() => toggleProject(project.id)}
              />
            ))}
          </div>
          {selectedProjects.length > 0 && (
            <p className="text-xs font-bold text-text-secondary text-center">{selectedProjects.length}개 프로젝트 선택됨</p>
          )}
        </div>

        {/* 섹션 2: 트러블슈팅 선택 */}
        <div className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-primary-hover">Step 2.</span>
            <h2 className="text-lg font-bold text-text-primary">트러블슈팅 선택</h2>
          </div>
          <p className="text-sm text-text-secondary -mt-2">포트폴리오에 포함할 트러블슈팅을 선택하세요</p>

          {selectedProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
              <FolderOpen className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">프로젝트를 먼저 선택해주세요</p>
            </div>
          ) : filteredTs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
              <p className="text-sm font-medium">선택한 프로젝트에 트러블슈팅이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredTs.map((ts) => (
                <TsCard
                  key={ts.id}
                  item={ts}
                  selected={selectedTs.includes(ts.id)}
                  onToggle={() => toggleTs(ts.id)}
                />
              ))}
            </div>
          )}
          {selectedTs.length > 0 && (
            <p className="text-xs font-bold text-text-secondary text-center">{selectedTs.length}개 트러블슈팅 선택됨</p>
          )}
        </div>

        {/* 섹션 3: AI 포트폴리오 생성 */}
        <div className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#6366f1]">Step 3.</span>
            <h2 className="text-lg font-bold text-text-primary">AI 포트폴리오 생성</h2>
          </div>
          <p className="text-sm text-text-secondary -mt-2">선택한 트러블슈팅으로 포트폴리오를 생성합니다</p>

          {generating ? (
            <div className="flex flex-col items-center justify-center py-12 gap-5">
              <div className="w-32 h-32 overflow-hidden">
                <img src={chatbotImg} alt="AI" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-lg font-bold text-text-primary">포트폴리오 생성 중...</span>
                <span className="text-sm text-text-secondary">트러블슈팅을 분석하고 있습니다</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] animate-pulse" style={{ animationDelay: '300ms' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] animate-pulse" style={{ animationDelay: '600ms' }} />
              </div>
            </div>
          ) : (
            <>
              {/* 선택 요약 */}
              <div className="flex flex-col gap-3 bg-[#FAF9F6] rounded-xl p-4 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-text-primary">선택된 프로젝트</span>
                  <span className="text-sm font-bold text-[#6366f1]">{selectedProjects.length}개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-text-primary">선택된 트러블슈팅</span>
                  <span className="text-sm font-bold text-[#6366f1]">{selectedTs.length}개</span>
                </div>
              </div>

              {/* 선택된 트러블슈팅 목록 */}
              {selectedTs.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-text-primary">포함될 트러블슈팅</span>
                  <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto">
                    {selectedTs.map((tsId) => {
                      const ts = MOCK_TROUBLESHOOTINGS.find((t) => t.id === tsId);
                      if (!ts) return null;
                      return (
                        <div
                          key={ts.id}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#eef2ff] border border-[#c7d2fe]"
                        >
                          <span
                            className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: CIRCLE_COLORS[(ts.id - 1) % CIRCLE_COLORS.length] }}
                          >
                            {ts.id}
                          </span>
                          <span className="text-xs text-text-secondary truncate">{ts.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI 챗봇 안내 */}
              <div className="flex items-start gap-2 mt-2">
                <div className="w-12 h-12 overflow-hidden flex-shrink-0">
                  <img src={chatbotImg} alt="AI" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-3 border border-border">
                  <p className="text-xs text-text-secondary leading-relaxed">
                    선택한 트러블슈팅을 AI가 분석하여 포트폴리오를 자동 생성합니다.
                    <br />생성 후 직접 수정 · 보완할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* 생성 버튼 */}
              <button
                onClick={handleGenerate}
                disabled={selectedTs.length === 0}
                className="w-full py-4 mt-auto rounded-xl text-sm font-bold tracking-wide text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed border-0 outline-none"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
              >
                <Sparkles className="w-4 h-4" />
                AI 포트폴리오 생성하기
              </button>
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default PortfolioCreate;
