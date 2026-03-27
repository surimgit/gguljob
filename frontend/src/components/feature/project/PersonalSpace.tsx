import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sparkles, MessageSquare, Send, AlertTriangle, Lightbulb, Code2, GitMerge, Pencil } from 'lucide-react';
import cardTroubleShooting from '../../../assets/images/card_trouble_shooting.png';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Pagination from '../../common/Pagination';
import { useAuthStore } from '../../../stores/authStore';
import type { PersonalSpaceData } from '../../../types/project';
import { generateTroubleshooting, getTroubleshootings, updateTroubleshooting, chatTrouble } from '../../../api/troubleshooting';
import type { TroubleshootingListItem } from '../../../api/troubleshooting';
import { getPullRequests } from '../../../api/projects';
import type { PullRequestListItem } from '../../../api/projects';
import { getRoleDisplayName, getRoleColor } from '../../../constants/skills';
import EmptyState from './EmptyState';

// ── 타입 ──────────────────────────────────────────────────────────────────────
type MrStatus = 'Open' | 'Merged' | 'Closed';

interface MrItem {
  id: number;
  prNumber: number;
  title: string;
  status: MrStatus;
  description: string;
  branch: string;
  commits: number;
  time: string;
  diffUrl: string | null;
}

interface TroubleshootingItem {
  id: number;
  title: string;
  problemDesc: string;
  solutionDesc: string;
  codeSnippet: string;
  sources: { label: string; color: string }[];
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: MrStatus }) => {
  const styles: Record<MrStatus, string> = {
    Open:   'bg-[#dcfce7] text-[#16a34a] border-transparent',
    Merged: 'bg-[#ffe4e6] text-[#e11d48] border-transparent',
    Closed: 'bg-[#f3f4f6] text-[#6b7280] border-transparent',
  };
  return (
    <span className={`text-sm font-bold tracking-wide px-4 py-1.5 rounded-full border flex-shrink-0 ${styles[status]}`}>
      {status}
    </span>
  );
};

const MrCard = ({ mr }: { mr: MrItem }) => {
  const statusColor = mr.status === 'Open' ? '#16A34A' : mr.status === 'Merged' ? '#E11D48' : '#6B7280';
  return (
  <div className="flex flex-col gap-0 border border-border rounded-2xl overflow-hidden" style={{ background: '#FAF9F6' }}>
    {/* 번호 + 제목 + 뱃지 + 세로라인 + 설명/메타 */}
    <div className="flex px-5 pt-5 pb-4">
      {/* 좌측: 번호 원 + 세로 라인 + 끝 점 */}
      <div className="flex flex-col items-center w-6 flex-shrink-0 mr-2">
        <span
          className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
          style={{ background: statusColor }}
        >
          #{mr.prNumber}
        </span>
        <div className="w-px flex-1 -mt-px" style={{ background: statusColor }} />
        <div className="w-2 h-2 rounded-full flex-shrink-0 -mt-px" style={{ background: statusColor }} />
      </div>
      {/* 우측: 제목 + 뱃지 + 설명 + 메타 */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          {mr.diffUrl ? (
            <a href={mr.diffUrl} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-text-primary leading-snug ml-3 mt-1 hover:text-primary hover:underline transition-colors">
              {mr.title}
            </a>
          ) : (
            <p className="text-lg font-bold text-text-primary leading-snug ml-3 mt-1">{mr.title}</p>
          )}
          <StatusBadge status={mr.status} />
        </div>
        <p className="text-base font-semibold text-text-secondary leading-relaxed mt-3 ml-3">{mr.description}</p>
        <div className="flex items-center gap-1.5 mt-3 ml-4">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-success flex-shrink-0">
            <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>
          </svg>
          <span className="text-sm text-text-tertiary font-mono">{mr.branch}</span>
          <span className="text-sm text-text-tertiary">·</span>
          <span className="text-sm text-text-tertiary">커밋 {mr.commits}개</span>
          <span className="text-sm text-text-tertiary">·</span>
          <span className="text-sm text-text-tertiary">{mr.time}</span>
        </div>
      </div>
    </div>

  </div>
  );
};


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

const TroubleshootingCard = ({ item, onSave }: { item: TroubleshootingItem; onSave?: (data: { title: string; situation: string; solution: string; codeSnippet: string }) => void }) => {
  const [editing, setEditing] = useState(false);
  const [problemDesc, setProblemDesc] = useState(item.problemDesc);
  const [solutionDesc, setSolutionDesc] = useState(item.solutionDesc);
  const [codeSnippet, setCodeSnippet] = useState(item.codeSnippet);

  return (
  <div className="flex flex-col border border-border rounded-2xl bg-surface overflow-hidden" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07), 0 1px 2px 0 rgba(0,0,0,0.04)' }}>
    {/* 번호 + 제목 */}
    <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
      <span className="flex items-center gap-1 text-2xl font-bold font-mono text-purple-400 flex-shrink-0">
        <GitMerge className="w-5 h-5" />
        #{item.id}
      </span>
      <h4 className="text-xl font-bold tracking-tight text-text-primary leading-snug flex-1">{item.title}</h4>
      {editing ? (
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setEditing(false)} className="px-4 py-1.5 rounded-xl text-sm font-bold text-text-secondary border border-border bg-surface hover:bg-background transition-colors">
            취소
          </button>
          <button
            onClick={() => { onSave?.({ title: item.title, situation: problemDesc, solution: solutionDesc, codeSnippet }); setEditing(false); }}
            className="px-4 py-1.5 rounded-xl text-sm font-bold text-text-primary bg-primary-hover hover:opacity-90 transition-opacity"
          >
            저장
          </button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-background transition-colors flex-shrink-0">
          <Pencil className="w-4 h-4" />
        </button>
      )}
    </div>

    {/* 섹션들 */}
    <div className="flex flex-col gap-5 px-6 py-6 bg-[#FAF9F6]">

      {/* 문제 상황 */}
      <div className="flex flex-col gap-2">
        <p className="text-base font-bold text-text-primary flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          문제 상황
        </p>
        {editing ? (
          <textarea value={problemDesc} onChange={(e) => setProblemDesc(e.target.value)} className="text-base text-text-secondary leading-relaxed w-full rounded-xl border border-border px-4 py-3 bg-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary" rows={3} />
        ) : (
          <div className="rounded-xl border border-border bg-surface px-4 py-3">
            <p className="text-base text-text-secondary leading-relaxed">{problemDesc}</p>
          </div>
        )}
      </div>

      {/* 해결 방법 */}
      <div className="flex flex-col gap-2">
        <p className="text-base font-bold text-text-primary flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-green-400 flex-shrink-0" />
          해결 방법
        </p>
        {editing ? (
          <textarea value={solutionDesc} onChange={(e) => setSolutionDesc(e.target.value)} className="text-base text-text-secondary leading-relaxed w-full rounded-xl border border-border px-4 py-3 bg-surface resize-none focus:outline-none focus:ring-2 focus:ring-primary" rows={3} />
        ) : (
          <div className="rounded-xl border border-border bg-surface px-4 py-3">
            <p className="text-base text-text-secondary leading-relaxed">{solutionDesc}</p>
          </div>
        )}
      </div>

      {/* 주요 코드 */}
      {(codeSnippet || editing) && (
        <div className="flex flex-col gap-2">
          <p className="text-base font-bold text-text-primary flex items-center gap-2">
            <Code2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
            주요 코드
          </p>
          {editing ? (
            <textarea value={codeSnippet} onChange={(e) => setCodeSnippet(e.target.value)} className="bg-[#1e1e2e] text-[#a6e3a1] text-sm rounded-xl px-4 py-3 overflow-x-auto font-mono leading-relaxed w-full resize-none focus:outline-none focus:ring-2 focus:ring-primary" rows={5} />
          ) : (
            <SyntaxHighlighter
              language={detectLang(codeSnippet)}
              style={vscDarkPlus}
              showLineNumbers
              customStyle={{ margin: 0, borderRadius: '12px', fontSize: '15px', lineHeight: '1.75', padding: '20px 24px' }}
              lineNumberStyle={{ color: '#555', minWidth: '2.5em', paddingRight: '1.2em', userSelect: 'none' }}
            >
              {codeSnippet}
            </SyntaxHighlighter>
          )}
        </div>
      )}
    </div>

  </div>
  );
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export type PersonalSubTab = 'troubleshooting' | 'mr-review';

const PersonalSpace = ({ projectId, projectTitle, personalData, subTab = 'troubleshooting' }: { projectId?: number; projectTitle?: string; personalData?: PersonalSpaceData | null; subTab?: PersonalSubTab }) => {
  const userName = useAuthStore((s) => s.user?.name) ?? '김도현';
  const userProfileImage = useAuthStore((s) => s.user?.profileImage);
  const userPosition = useAuthStore((s) => s.user?.position);
  const positionLabel = userPosition ? getRoleDisplayName(userPosition) : 'Developer';
  const [mrPage, setMrPage] = useState(0);
  const [tsPage, setTsPage] = useState(0);
  const [tsList, setTsList] = useState<TroubleshootingItem[]>([]);
  const [tsTotalPages, setTsTotalPages] = useState(0);
  const [tsTotalElements, setTsTotalElements] = useState(0);
  const [tsLoading, setTsLoading] = useState(false);
  const [mrList, setMrList] = useState<MrItem[]>([]);
  const [mrTotalPages, setMrTotalPages] = useState(0);
  const [mrTotalElements, setMrTotalElements] = useState(0);
  const [mrLoading, setMrLoading] = useState(false);
  const [showAiSection, setShowAiSection] = useState(false);
  const [aiMrList, setAiMrList] = useState<MrItem[]>([]);
  const [generatedPrIds, setGeneratedPrIds] = useState<Set<number>>(new Set());
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [selectedMrId, setSelectedMrId] = useState<number | null>(null);
  const availablePrIds = useMemo(
    () => new Set(aiMrList.filter(mr => !generatedPrIds.has(mr.id)).map(mr => mr.id)),
    [aiMrList, generatedPrIds],
  );
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const MR_PER_PAGE = 3;
  const TS_PER_PAGE = 3;

  const fetchTroubleshootings = useCallback(async (page: number) => {
    if (!projectId) return;
    setTsLoading(true);
    try {
      const { data } = await getTroubleshootings(projectId, page, TS_PER_PAGE);
      setTsList(data.content.map((ts: TroubleshootingListItem) => ({
        id: ts.tsId,
        title: ts.title,
        problemDesc: ts.situation,
        solutionDesc: ts.solution,
        codeSnippet: ts.code_snippet,
        sources: [],
      })));
      setTsTotalPages(data.totalPages);
      setTsTotalElements(data.totalElements);
    } catch (err) {
      console.error('트러블슈팅 목록 조회 실패:', err);
    } finally {
      setTsLoading(false);
    }
  }, [projectId]);

  const fetchPullRequests = useCallback(async (page: number) => {
    if (!projectId) return;
    setMrLoading(true);
    try {
      const { data } = await getPullRequests(projectId, page, MR_PER_PAGE);
      setMrList(data.content.map((pr: PullRequestListItem) => ({
        id: pr.prId,
        prNumber: pr.prNumber,
        title: pr.title,
        status: pr.status as MrStatus,
        description: '',
        branch: `#${pr.prNumber}`,
        commits: 0,
        time: new Date(pr.githubCreatedAt).toLocaleDateString(),
        diffUrl: pr.diff_url ?? null,
      })));
      setMrTotalPages(data.totalPages);
      setMrTotalElements(data.totalElements);
    } catch (err) {
      console.error('PR 목록 조회 실패:', err);
    } finally {
      setMrLoading(false);
    }
  }, [projectId]);

  const fetchAllPullRequests = useCallback(async () => {
    if (!projectId) return;
    try {
      const [prData, tsData] = await Promise.all([
        getPullRequests(projectId, 0, 100),
        getTroubleshootings(projectId, 0, 100),
      ]);
      setAiMrList(prData.data.content.map((pr: PullRequestListItem) => ({
        id: pr.prId,
        prNumber: pr.prNumber,
        title: pr.title,
        status: pr.status as MrStatus,
        description: '',
        branch: `#${pr.prNumber}`,
        commits: 0,
        time: new Date(pr.githubCreatedAt).toLocaleDateString(),
        diffUrl: pr.diff_url ?? null,
      })));
      setGeneratedPrIds(new Set(tsData.data.content.map((ts: TroubleshootingListItem) => Number(ts.prId))));
    } catch (err) {
      console.error('전체 PR 목록 조회 실패:', err);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId && subTab === 'troubleshooting') {
      fetchTroubleshootings(tsPage);
    }
  }, [projectId, tsPage, subTab, fetchTroubleshootings]);

  useEffect(() => {
    if (projectId && subTab === 'mr-review') {
      fetchPullRequests(mrPage);
    }
  }, [projectId, mrPage, subTab, fetchPullRequests]);

  useEffect(() => {
    if (projectId && subTab === 'troubleshooting') {
      fetchAllPullRequests();
    }
  }, [projectId, subTab, fetchAllPullRequests]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChatSend = async () => {
    if (!chatInput.trim() || !projectId || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    try {
      const { data } = await chatTrouble({ projectId, userMessage: userMsg });
      setChatMessages(prev => [...prev, { role: 'ai', content: data.aiAnswer }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', content: '오류가 발생했습니다. 다시 시도해주세요.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const mrCount = projectId ? mrTotalElements : (personalData?.stats.prCount ?? 0);
  const stats = { mrCount, autoGenCount: projectId ? tsTotalElements : (personalData?.stats.troubleshootingCount ?? 0) };

  return (
    <div className="flex flex-col gap-10">

      {/* AI 생성 플로팅 토스트 */}
      {(aiGenerating || aiSuccess) && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-bold text-white transition-all"
          style={{ background: aiSuccess ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #6366f1, #7c3aed)' }}
        >
          {aiGenerating ? (
            <>
              <svg className="w-4 h-4 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              AI 트러블슈팅 생성 중...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              트러블슈팅 생성 완료! 🎉
            </>
          )}
        </div>
      )}

      {/* 프로필 */}
      <div className="flex items-center justify-between gap-5 mt-4 min-h-[104px]">
        <div className="flex items-center gap-3">
          {userProfileImage ? (
            <img src={userProfileImage} alt={userName} className="w-20 h-20 rounded-full flex-shrink-0 shadow-sm object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-hover flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <p className="text-2xl font-bold tracking-wide text-text-primary leading-tight">{userName}</p>
            <p className="text-xl font-semibold tracking-wide leading-tight mt-2">
              <span style={{ color: getRoleColor(userPosition ?? '') }}>{positionLabel} · </span>
              <span className="text-text-brown">{projectTitle ?? 'DevLog 트러블슈팅 플랫폼'}</span>
            </p>
          </div>
        </div>
        {subTab === 'troubleshooting' && (
          <button
            onClick={() => {
              setShowAiSection(prev => !prev);
              setSelectedMrId(null);
            }}
            className="flex items-center gap-3 px-4 py-2 rounded-2xl flex-shrink-0 transition-all hover:scale-105 active:scale-95 border border-[#c7d2fe]"
            style={{ background: 'linear-gradient(180deg, #f5f3ff 0%, #eef2ff 100%)', boxShadow: '0 4px 16px 0 rgba(199,210,254,0.4)' }}
          >
            <img src={cardTroubleShooting} alt="AI 자동 생성" className="h-[80px] w-auto" />
            <div className="flex flex-col items-center gap-0.5 pr-1">
              <span className="text-base font-bold text-[#7c3aed] leading-tight whitespace-nowrap">AI</span>
              <span className="text-base font-bold text-[#7c3aed] leading-tight whitespace-nowrap">자동 생성</span>
            </div>
          </button>
        )}
      </div>

      {/* ── 트러블슈팅 탭 ── */}
      {subTab === 'troubleshooting' && (
        <div className="flex flex-col gap-6 relative">

          {/* AI 트러블슈팅 자동 생성 섹션 */}
          {showAiSection && (
              <div className="mb-6 rounded-2xl px-7 py-6 border border-[#c7d2fe] relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #f5f3ff 0%, #eef2ff 100%)' }}>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#6366f1]" />
                    <span className="text-lg font-bold text-text-primary">AI 트러블슈팅 자동 생성</span>
                    <span className="text-[10px] font-bold tracking-wider bg-[#6366f1] text-white px-2.5 py-0.5 rounded-full">Beta</span>
                  </div>
                  <span className="text-sm text-text-tertiary font-medium">마지막 분석: 3분 전</span>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed mb-1">
                  내 커밋 메시지, PR 설명, 코드 리뷰 내용을 AI가 분석하여 트러블슈팅 문서를 자동으로 초안 작성합니다.
                </p>
                <p className="text-sm text-text-secondary leading-relaxed mb-5">
                  생성 후 직접 수정·보완하여 포트폴리오로 활용할 수 있습니다.
                </p>

                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border border-[#c7d2fe] bg-white text-text-primary">
                    <MessageSquare className="w-3.5 h-3.5 text-[#6366f1]" />
                    PR <span className="text-[#6366f1] font-bold">{aiMrList.filter(mr => !generatedPrIds.has(mr.id)).length}건</span>
                  </span>
                </div>

                {/* PR 리스트 선택 */}
                {aiMrList.filter(mr => !generatedPrIds.has(mr.id)).length > 0 && (
                  <div className="flex flex-col gap-1.5 mb-5 overflow-y-auto" style={{ maxHeight: Math.min(aiMrList.filter(mr => !generatedPrIds.has(mr.id)).length, 6) * 46 }}>
                    {aiMrList.filter(mr => !generatedPrIds.has(mr.id)).map((mr) => (
                      <label
                        key={mr.id}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors border flex-shrink-0 ${
                          selectedMrId === mr.id
                            ? 'bg-[#eef2ff] border-[#c7d2fe]'
                            : 'bg-white border-border hover:bg-[#f9fafb]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="ai-mr-select"
                          checked={selectedMrId === mr.id}
                          onChange={() => setSelectedMrId(mr.id)}
                          className="accent-[#6366f1] w-4 h-4 flex-shrink-0"
                        />
                        <span className="text-sm text-text-secondary truncate">{mr.title}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* AI 챗봇 대화 영역 */}
                <div className="flex flex-col gap-3 mb-5">
                  {chatMessages.length > 0 && (
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto rounded-xl bg-white border border-border px-4 py-3">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                              msg.role === 'user'
                                ? 'bg-[#6366f1] text-white rounded-br-md'
                                : 'bg-[#f3f4f6] text-text-primary rounded-bl-md'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-[#f3f4f6] text-text-tertiary px-3.5 py-2.5 rounded-2xl rounded-bl-md text-sm">
                            답변 생성 중...
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleChatSend(); }}
                      placeholder="트러블슈팅 관련 질문을 입력하세요..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                      disabled={chatLoading}
                    />
                    <button
                      onClick={handleChatSend}
                      disabled={chatLoading || !chatInput.trim()}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

<button
                  onClick={async () => {
                    if (!selectedMrId || !availablePrIds.has(selectedMrId)) return;
                    setAiGenerating(true);
                    setAiSuccess(false);
                    try {
                      await generateTroubleshooting(selectedMrId, projectId!);
                      setAiSuccess(true);
                      setSelectedMrId(null);
                      fetchTroubleshootings(0);
                      fetchAllPullRequests();
                    } catch (err) {
                      console.error('트러블슈팅 생성 실패:', err);
                    } finally {
                      setAiGenerating(false);
                    }
                  }}
                  disabled={aiGenerating || !selectedMrId || !availablePrIds.has(selectedMrId)}
                  className="w-full py-3.5 rounded-xl text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}
                >
                  {aiGenerating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      트러블슈팅 자동 생성하기
                    </>
                  )}
                </button>
              </div>
            )}

          <div className="rounded-2xl px-8 py-8 border border-border bg-surface" style={{ boxShadow: '0 4px 16px 0 rgba(0,0,0,0.07), 0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-2 mb-6 mt-3">
              <div className="w-7 h-7 rounded-full bg-[#eef2ff] flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-[#6366f1]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-text-primary">트러블슈팅</span>
              <span className="ml-auto text-base text-text-secondary font-semibold">총 {stats.autoGenCount}건</span>
            </div>
            {tsLoading ? (
              <div className="flex items-center justify-center py-12 text-text-tertiary">불러오는 중...</div>
            ) : tsList.length === 0 ? (
              <EmptyState message="아직 등록된 트러블슈팅이 없습니다." />
            ) : (
              <>
                <div className="flex flex-col gap-10">
                  {tsList.map(item => (
                    <TroubleshootingCard
                      key={item.id}
                      item={item}
                      onSave={(data) => updateTroubleshooting(item.id, data).catch(err => console.error('트러블슈팅 수정 실패:', err))}
                    />
                  ))}
                </div>
                <Pagination
                  current={tsPage + 1}
                  totalPages={tsTotalPages}
                  onChange={(page) => { setTsPage(page - 1); window.scrollTo(0, 0); }}
                  className="mt-6"
                />
              </>
            )}
          </div>

        </div>
      )}

      {/* ── 내 PR 탭 ── */}
      {subTab === 'mr-review' && (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl px-8 py-8 border border-border bg-surface" style={{ boxShadow: '0 4px 16px 0 rgba(0,0,0,0.07), 0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-2 mb-6 mt-3">
              <div className="w-7 h-7 rounded-full bg-[#eef2ff] flex items-center justify-center flex-shrink-0">
                <GitMerge className="w-4 h-4 text-[#6366f1]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-text-primary">내 PR</span>
              <span className="ml-auto text-base text-text-secondary font-semibold">총 {stats.mrCount}건</span>
            </div>
            {mrLoading ? (
              <div className="flex items-center justify-center py-12 text-text-tertiary">불러오는 중...</div>
            ) : mrList.length === 0 ? (
              <EmptyState message="아직 등록된 PR이 없습니다." />
            ) : (
              <>
                <div className="flex flex-col gap-10">
                  {mrList.map(mr => <MrCard key={mr.id} mr={mr} />)}
                </div>

                {/* 페이지네이션 */}
                <Pagination
                  current={mrPage + 1}
                  totalPages={mrTotalPages}
                  onChange={(page) => { setMrPage(page - 1); window.scrollTo(0, 0); }}
                  className="mt-6"
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalSpace;