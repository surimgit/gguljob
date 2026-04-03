import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FolderOpen, CheckCircle2, Sparkles, Copy, Check, RotateCcw, Download, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { MarkdownRenderer } from '../components/common';
import chatbotImg from '../assets/images/chatbot.png';
import { getMyProjects } from '../api/projects';
import { getTroubleshootings } from '../api/troubleshooting';
import { generatePortfolio, downloadPortfolio, savePortfolioAsFile } from '../api/portfolio';
import type { ProjectSimple } from '../types/project';
import type { TroubleshootingListItem } from '../api/troubleshooting';

// ── 타입 ──────────────────────────────────────────────────────────────────────
interface TsItemWithProject extends TroubleshootingListItem {
  projectId: number;
}

const CIRCLE_COLORS = ['#E11D48', '#2563EB', '#16A34A', '#E8B931', '#9333EA', '#F97316', '#0EA5E9', '#6D28D9'];

// ── 프로젝트 카드 ─────────────────────────────────────────────────────────────
const ProjectCard = ({ project, active, hasSelectedTs, onToggle }: { project: ProjectSimple; active: boolean; hasSelectedTs: boolean; onToggle: () => void }) => {
  const isActive = project.status !== 'DONE';
  const isSelected = active || hasSelectedTs;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isSelected}
      className={`rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition-all text-left w-full ${
        isSelected
          ? 'border-2 border-primary-hover bg-primary-soft shadow-md'
          : active
            ? 'border-2 border-primary-hover bg-surface shadow-sm'
            : 'border-2 border-border bg-surface hover:shadow-md'
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between w-full">
        <span className="text-sm font-bold" style={{ color: 'var(--color-amber)' }}>
          {project.domain}
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-sm font-medium" style={{ color: isActive ? 'var(--color-success-dark)' : 'var(--color-text-tertiary)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isActive ? 'var(--color-success-dark)' : 'var(--color-text-tertiary)' }} />
            {project.status === 'RECRUITING' ? '모집중' : project.status === 'PROCEEDING' ? '진행중' : '완료'}
          </span>
          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary-hover" />}
        </div>
      </div>

      {/* 본문 */}
      <div>
        <h3 className="text-base font-bold text-text-primary">{project.title}</h3>
        <p className="text-base text-text-secondary mt-1">{project.teamName}</p>
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
const TsCard = ({ item, selected, onToggle }: { item: TsItemWithProject; selected: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={selected}
    className={`flex flex-col border-2 rounded-xl overflow-hidden cursor-pointer transition-all text-left w-full min-h-[125px] ${
      selected
        ? 'border-primary-hover bg-primary-soft shadow-md'
        : 'border-border bg-surface hover:shadow-md'
    }`}
  >
    <div className="flex items-center gap-3 px-4 py-3 w-full">
      <span
        className="w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: CIRCLE_COLORS[(item.tsId - 1) % CIRCLE_COLORS.length] }}
      >
        {item.tsId}
      </span>
      <h4 className="text-base font-bold text-text-primary leading-snug flex-1 truncate">{item.title}</h4>
      {selected && <CheckCircle2 className="w-5 h-5 text-primary-hover flex-shrink-0" />}
    </div>
    <div className="flex flex-col gap-0.5 px-4 pb-3 border-t border-border pt-2 w-full" style={{ background: '#FAF9F6' }}>
      <p className="text-[11px] font-bold text-text-primary">문제 상황</p>
      <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">{item.situation}</p>
    </div>
  </button>
);

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
const PortfolioCreate = () => {
  const navigate = useNavigate();

  // 데이터 상태
  const [projects, setProjects] = useState<ProjectSimple[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [tsMap, setTsMap] = useState<Record<number, TsItemWithProject[]>>({});
  const [tsLoading, setTsLoading] = useState(false);

  // 선택 상태
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [activeProject, setActiveProject] = useState<number | null>(null);
  const [selectedTs, setSelectedTs] = useState<number[]>([]);

  // 생성 상태
  const [generating, setGenerating] = useState(false);
  const [generatedMd, setGeneratedMd] = useState<string | null>(null);
  const [generatedPortfolioId, setGeneratedPortfolioId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  // Step 1: 내 프로젝트 목록 로드
  useEffect(() => {
    getMyProjects()
      .then(({ data }) => setProjects(data))
      .catch(() => toast.error('프로젝트 목록을 불러오지 못했습니다.'))
      .finally(() => setProjectsLoading(false));
  }, []);

  // Step 2: 프로젝트 선택 시 트러블슈팅 로드
  const fetchTs = useCallback(async (projectId: number) => {
    if (tsMap[projectId]) return; // 이미 로드됨
    setTsLoading(true);
    try {
      const { data } = await getTroubleshootings(projectId, 0, 100);
      const items: TsItemWithProject[] = data.content.map((ts) => ({ ...ts, projectId }));
      setTsMap((prev) => ({ ...prev, [projectId]: items }));
    } catch {
      toast.error('트러블슈팅 목록을 불러오지 못했습니다.');
    } finally {
      setTsLoading(false);
    }
  }, [tsMap]);

  const toggleProject = (projectId: number) => {
    if (activeProject === projectId) {
      setActiveProject(null);
      setSelectedProjects([]);
      setSelectedTs([]);
      return;
    }

    setActiveProject(projectId);
    setSelectedProjects([projectId]);
    setSelectedTs([]);
    fetchTs(projectId);
  };

  const toggleTs = (tsId: number) => {
    setSelectedTs((prev) =>
      prev.includes(tsId) ? prev.filter((v) => v !== tsId) : [...prev, tsId]
    );
  };

  // 현재 활성 프로젝트의 트러블슈팅
  const filteredTs = activeProject ? (tsMap[activeProject] ?? []) : [];

  // 전체 선택된 트러블슈팅 (모든 프로젝트에서)
  const allTsItems = Object.values(tsMap).flat();
  const selectedTsItems = allTsItems.filter((ts) => selectedTs.includes(ts.tsId));

  // Step 3: AI 포트폴리오 생성
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: result } = await generatePortfolio({ tsIds: selectedTs });
      const pId = result.data.portfolioId;
      setGeneratedPortfolioId(pId);
      // 생성된 포트폴리오 마크다운 다운로드
      const { data: md } = await downloadPortfolio(pId);
      setGeneratedMd(typeof md === 'string' ? md : new TextDecoder().decode(md as unknown as ArrayBuffer));
    } catch (err) {
      console.error('포트폴리오 생성 실패:', err);
      toast.error('포트폴리오 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
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
    <div className="max-w-[1400px] mx-auto py-10 px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-text-primary">포트폴리오 생성</h1>
        </div>
        <Link
          to="/mypage/portfolio"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-base font-bold border border-border bg-surface hover:bg-background transition-colors text-text-secondary"
        >
          <List className="w-4 h-4" />
          내 포트폴리오
        </Link>
      </div>

      {generatedMd ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {/* Step3: AI 포트폴리오 생성 (왼쪽) */}
          <div className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-[#6366f1]">Step 3.</span>
              <h2 className="text-lg font-bold text-text-primary">AI 포트폴리오 생성</h2>
            </div>
            <p className="text-base text-text-secondary -mt-2">선택한 트러블슈팅을 기반으로 포트폴리오를 생성합니다</p>

            {/* 선택 요약 */}
            <div className="flex flex-col gap-3 bg-[#FAF9F6] rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-text-primary">선택된 프로젝트</span>
                <span className="text-base font-bold text-[#6366f1]">{selectedProjects.length}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-text-primary">선택된 트러블슈팅</span>
                <span className="text-base font-bold text-[#6366f1]">{selectedTs.length}개</span>
              </div>
            </div>

            {/* 선택된 트러블슈팅 목록 */}
            {selectedTsItems.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-base font-bold text-text-primary">포함된 트러블슈팅</span>
                <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto">
                  {selectedTsItems.map((ts) => (
                    <div
                      key={ts.tsId}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#eef2ff] border border-[#c7d2fe]"
                    >
                      <span
                        className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: CIRCLE_COLORS[(ts.tsId - 1) % CIRCLE_COLORS.length] }}
                      >
                        {ts.tsId}
                      </span>
                      <span className="text-sm text-text-secondary truncate">{ts.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 다시 선택 버튼 */}
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-3 mt-auto rounded-xl text-base font-bold border border-border bg-white hover:bg-background transition-colors text-text-secondary flex items-center justify-center gap-2"
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generatedPortfolioId && savePortfolioAsFile(generatedPortfolioId).catch(() => toast.error('다운로드에 실패했습니다.'))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border border-border bg-white hover:bg-background transition-colors text-text-secondary"
                >
                  <Download className="w-4 h-4" />
                  다운로드
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border border-border bg-white hover:bg-background transition-colors text-text-secondary"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? '복사됨' : '복사'}
                </button>
              </div>
            </div>
            <MarkdownRenderer className="bg-[#FAF9F6] border border-border rounded-xl p-6 overflow-auto max-h-[70vh] text-base leading-relaxed">
              {generatedMd}
            </MarkdownRenderer>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {/* 섹션 1: 프로젝트 선택 */}
        <div className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-primary-hover">Step 1.</span>
            <h2 className="text-lg font-bold text-text-primary">프로젝트 선택</h2>
          </div>
          <p className="text-base text-text-secondary -mt-2">포트폴리오에 포함할 프로젝트를 선택하세요</p>
          {projectsLoading ? (
            <div className="flex items-center justify-center py-16 text-text-tertiary">
              <p className="text-base font-medium">불러오는 중...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
              <FolderOpen className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-base font-medium">참여 중인 프로젝트가 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
              {projects.map((project) => (
                <ProjectCard
                  key={project.projectId}
                  project={project}
                  active={activeProject === project.projectId}
                  hasSelectedTs={allTsItems.some((ts) => ts.projectId === project.projectId && selectedTs.includes(ts.tsId))}
                  onToggle={() => toggleProject(project.projectId)}
                />
              ))}
            </div>
          )}
          {selectedProjects.length > 0 && (
            <p className="text-sm font-bold text-text-secondary text-center">{selectedProjects.length}개 프로젝트 선택됨</p>
          )}
        </div>

        {/* 섹션 2: 트러블슈팅 선택 */}
        <div className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-primary-hover">Step 2.</span>
            <h2 className="text-lg font-bold text-text-primary">트러블슈팅 선택</h2>
          </div>
          <p className="text-base text-text-secondary -mt-2">포트폴리오에 포함할 트러블슈팅을 선택하세요</p>

          {selectedProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
              <FolderOpen className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-base font-medium">프로젝트를 먼저 선택해주세요</p>
            </div>
          ) : tsLoading ? (
            <div className="flex items-center justify-center py-16 text-text-tertiary">
              <p className="text-base font-medium">불러오는 중...</p>
            </div>
          ) : filteredTs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
              <p className="text-base font-medium">선택한 프로젝트에 트러블슈팅이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto">
              {filteredTs.map((ts) => (
                <TsCard
                  key={ts.tsId}
                  item={ts}
                  selected={selectedTs.includes(ts.tsId)}
                  onToggle={() => toggleTs(ts.tsId)}
                />
              ))}
            </div>
          )}
          {selectedTs.length > 0 && (
            <p className="text-sm font-bold text-text-secondary text-center">{selectedTs.length}개 트러블슈팅 선택됨</p>
          )}
        </div>

        {/* 섹션 3: AI 포트폴리오 생성 */}
        <div className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-6" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#6366f1]">Step 3.</span>
            <h2 className="text-lg font-bold text-text-primary">AI 포트폴리오 생성</h2>
          </div>
          <p className="text-base text-text-secondary -mt-2">선택한 트러블슈팅으로 포트폴리오를 생성합니다</p>

          {generating ? (
            <div className="flex flex-col items-center justify-center py-12 gap-5">
              <div className="w-32 h-32 overflow-hidden">
                <img src={chatbotImg} alt="AI" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-lg font-bold text-text-primary">포트폴리오 생성 중...</span>
                <span className="text-base text-text-secondary">트러블슈팅을 분석하고 있습니다</span>
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
                  <span className="text-base font-bold text-text-primary">선택된 프로젝트</span>
                  <span className="text-base font-bold text-[#6366f1]">{selectedProjects.length}개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-text-primary">선택된 트러블슈팅</span>
                  <span className="text-base font-bold text-[#6366f1]">{selectedTs.length}개</span>
                </div>
              </div>

              {/* 선택된 트러블슈팅 목록 */}
              {selectedTsItems.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-base font-bold text-text-primary">포함될 트러블슈팅</span>
                  <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto">
                    {selectedTsItems.map((ts) => (
                      <div
                        key={ts.tsId}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#eef2ff] border border-[#c7d2fe]"
                      >
                        <span
                          className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: CIRCLE_COLORS[(ts.tsId - 1) % CIRCLE_COLORS.length] }}
                        >
                          {ts.tsId}
                        </span>
                        <span className="text-sm text-text-secondary truncate">{ts.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI 챗봇 안내 */}
              <div className="flex items-start gap-2 mt-2">
                <div className="w-9 h-12 overflow-hidden flex-shrink-0">
                  <img src={chatbotImg} alt="AI" className="w-full h-full object-cover" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-3 border border-border">
                  <p className="text-sm text-text-secondary leading-relaxed">
                    선택한 트러블슈팅을 AI가 분석하여 포트폴리오를 자동 생성합니다.
                    <br />생성 후 직접 수정 · 보완할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* 생성 버튼 */}
              <button
                onClick={handleGenerate}
                disabled={selectedTs.length === 0}
                className="w-full py-4 mt-auto rounded-xl text-base font-bold tracking-wide text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed border-0 outline-none"
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
