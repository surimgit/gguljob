import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import type { PersonalSpaceData } from '../../../types/project';
import { generateTroubleshooting, getTroubleshootings, updateTroubleshooting } from '../../../api/troubleshooting';
import type { TroubleshootingListItem } from '../../../api/troubleshooting';
import { getPullRequests } from '../../../api/projects';
import type { PullRequestListItem } from '../../../api/projects';
import EmptyState from './EmptyState';

// ── 타입 ──────────────────────────────────────────────────────────────────────
type MrStatus = 'Open' | 'Merged' | 'Closed';

interface CodeReview {
  author: string;
  role: string;
  comment: string;
  avatarColor: string;
}

interface MrItem {
  id: number;
  title: string;
  status: MrStatus;
  description: string;
  branch: string;
  commits: number;
  time: string;
  reviews: CodeReview[];
}

interface TroubleshootingItem {
  id: number;
  title: string;
  problemDesc: string;
  solutionDesc: string;
  codeSnippet: string;
  sources: { label: string; color: string }[];
}

const POSITION_DISPLAY: Record<string, string> = {
  FE: 'Frontend Developer',
  BE: 'Backend Developer',
  AI: 'AI Developer',
  PM: 'Project Manager',
  INFRA: 'Infra Developer',
  DESIGN: 'Designer',
  FRONTEND: 'Frontend Developer',
  BACKEND: 'Backend Developer',
  DEVOPS: 'DevOps Engineer',
  DATA: 'Data Engineer',
  DATABASE: 'Database Engineer',
  MOBILE: 'Mobile Developer',
  TOOLS: 'Tools Engineer',
};

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
          className="w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center flex-shrink-0"
          style={{ background: statusColor }}
        >
          {mr.id}
        </span>
        <div className="w-px flex-1 -mt-px" style={{ background: statusColor }} />
        <div className="w-2 h-2 rounded-full flex-shrink-0 -mt-px" style={{ background: statusColor }} />
      </div>
      {/* 우측: 제목 + 뱃지 + 설명 + 메타 */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg font-bold text-text-primary leading-snug ml-3 mt-1">{mr.title}</p>
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

    {/* 코드 리뷰 */}
    {mr.reviews.length > 0 && (
      <div className="flex flex-col gap-0 border-t border-border">
        <div className="flex items-center gap-1.5 px-5 py-3 bg-background my-3">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p className="text-base font-bold text-text-primary">코드 리뷰 ({mr.reviews.length}건)</p>
        </div>
        <div className="flex flex-col gap-0">
          {mr.reviews.map((r, i) => (
            <div key={i} className={`flex items-start gap-3 px-5 py-3 my-2 ${i < mr.reviews.length - 1 ? 'border-b border-border' : ''}`}>
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold mt-0.5"
                style={{ backgroundColor: r.avatarColor }}
              >
                {r.author[0]}
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <span className="text-base font-bold text-text-primary">{r.author} · {r.role}</span>
                <p className="text-base font-medium text-text-secondary leading-relaxed">{r.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
  );
};

const CIRCLE_COLORS = ['#E11D48', '#2563EB', '#16A34A', '#E8B931', '#9333EA', '#F97316', '#0EA5E9', '#6D28D9'];

const TroubleshootingCard = ({ item, onSave }: { item: TroubleshootingItem; onSave?: (data: { title: string; situation: string; solution: string; codeSnippet: string }) => void }) => {
  const [editing, setEditing] = useState(false);
  const [problemDesc, setProblemDesc] = useState(item.problemDesc);
  const [solutionDesc, setSolutionDesc] = useState(item.solutionDesc);
  const [codeSnippet, setCodeSnippet] = useState(item.codeSnippet);

  return (
  <div className="flex flex-col border border-border rounded-2xl bg-surface overflow-hidden" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07), 0 1px 2px 0 rgba(0,0,0,0.04)' }}>
    {/* 번호 + 제목 */}
    <div className="flex items-center gap-3 px-5 py-5">
      <span className="w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center flex-shrink-0" style={{ backgroundColor: CIRCLE_COLORS[(item.id - 1) % CIRCLE_COLORS.length] }}>
        {item.id}
      </span>
      <h4 className="text-xl font-bold tracking-tight text-text-primary leading-snug">{item.title}</h4>
    </div>

    {/* 문제 상황 */}
    <div className="flex flex-col gap-2 px-5 py-4 border-t border-border bg-[#FAF9F6]">
      <p className="text-lg font-bold tracking-wide text-text-primary flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
        문제 상황
      </p>
      {editing ? (
        <textarea value={problemDesc} onChange={(e) => setProblemDesc(e.target.value)} className="text-lg text-text-secondary leading-relaxed w-full rounded-xl border border-border px-4 py-3 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary" rows={3} />
      ) : (
        <p className="text-lg text-semibold text-text-secondary leading-relaxed">{problemDesc}</p>
      )}
    </div>

    {/* 해결 방법 */}
    <div className="flex flex-col gap-2 px-5 py-4 bg-[#FAF9F6]">
      <p className="text-lg font-semibold tracking-wide text-text-primary flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        해결 방법
      </p>
      {editing ? (
        <textarea value={solutionDesc} onChange={(e) => setSolutionDesc(e.target.value)} className="text-lg text-text-secondary leading-relaxed w-full rounded-xl border border-border px-4 py-3 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary" rows={3} />
      ) : (
        <p className="text-lg text-text-secondary leading-relaxed mb-3">{solutionDesc}</p>
      )}
      {editing ? (
        <textarea value={codeSnippet} onChange={(e) => setCodeSnippet(e.target.value)} className="bg-[#1e1e2e] text-[#a6e3a1] text-sm rounded-xl px-4 py-3 overflow-x-auto font-mono leading-relaxed w-full resize-none focus:outline-none focus:ring-2 focus:ring-primary mt-4" rows={5} />
      ) : (
        <pre className="bg-[#1e1e2e] text-[#a6e3a1] text-sm rounded-xl px-4 py-3 overflow-x-auto font-mono leading-relaxed">
          {codeSnippet}
        </pre>
      )}
    </div>

    {/* 출처 */}
    <div className="flex flex-col gap-2 px-5 pt-4 pb-8 bg-[#FAF9F6]">
      <p className="text-lg font-semibold tracking-wide text-text-primary flex items-center gap-1.5 mb-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        출처
      </p>
      <div className="flex items-center gap-4">
        {item.sources.map((s, i) => (
          <span key={s.label} className="flex items-center gap-1.5 text-base font-semibold text-text-primary">
            <span className="text-lg leading-none">{i === 0 ? '💛' : '🔄'}</span>
            {s.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-base font-semibold text-text-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          오준혁 리뷰
        </span>
      </div>
    </div>

    {/* 하단 버튼 */}
    <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-border bg-surface">
      <span className="text-sm tracking-wide text-text-tertiary">3분 전 생성</span>
      <div className="flex gap-2 flex-shrink-0">
        {editing ? (
          <>
            <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold text-text-secondary border border-border bg-surface hover:bg-background transition-colors">
              취소
            </button>
            <button
              onClick={() => {
                onSave?.({ title: item.title, situation: problemDesc, solution: solutionDesc, codeSnippet });
                setEditing(false);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold text-text-primary bg-primary-hover hover:opacity-90 transition-opacity"
            >
              저장
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-bold text-text-primary bg-primary-hover hover:opacity-90 transition-opacity">
            수정
          </button>
        )}
      </div>
    </div>
  </div>
  );
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export type PersonalSubTab = 'troubleshooting' | 'mr-review';

const PersonalSpace = ({ projectId, projectTitle, personalData, subTab = 'troubleshooting' }: { projectId?: number; projectTitle?: string; personalData?: PersonalSpaceData | null; subTab?: PersonalSubTab }) => {
  const userName = useAuthStore((s) => s.user?.name) ?? '김도현';
  const userPosition = useAuthStore((s) => s.user?.position);
  const positionLabel = (userPosition && POSITION_DISPLAY[userPosition]) || 'Developer';
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
  const [aiGenerating, setAiGenerating] = useState(false);
  const [selectedMrId, setSelectedMrId] = useState<number | null>(null);
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
        solutionDesc: '',
        codeSnippet: '',
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
        title: pr.title,
        status: pr.status as MrStatus,
        description: '',
        branch: `#${pr.prNumber}`,
        commits: 0,
        time: new Date(pr.githubCreatedAt).toLocaleDateString(),
        reviews: [],
      })));
      setMrTotalPages(data.totalPages);
      setMrTotalElements(data.totalElements);
    } catch (err) {
      console.error('PR 목록 조회 실패:', err);
    } finally {
      setMrLoading(false);
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

  const mrCount = projectId ? mrTotalElements : (personalData?.stats.prCount ?? 0);
  const codeReviews = personalData?.stats.reviewCount ?? 0;
  const stats = { mrCount, autoGenCount: projectId ? tsTotalElements : (personalData?.stats.troubleshootingCount ?? 0) };

  return (
    <div className="flex flex-col gap-10">

      {/* 프로필 */}
      <div className="flex items-center justify-between gap-5 mt-4">
        {/* 프로필 */}
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-primary-hover flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-2xl font-bold tracking-wide text-text-primary leading-tight">{userName}</p>
            <p className="text-xl font-semibold tracking-wide leading-tight mt-2">
              <span className="text-text-secondary">{positionLabel} · </span>
              <span className="text-text-brown">{projectTitle ?? 'DevLog 트러블슈팅 플랫폼'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── 트러블슈팅 탭 ── */}
      {subTab === 'troubleshooting' && (
        <div className="flex flex-col gap-6 relative">
          <div className="rounded-2xl px-8 py-8 border border-border bg-surface" style={{ boxShadow: '0 4px 16px 0 rgba(0,0,0,0.07), 0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 mt-3">
                <div className="w-7 h-7 rounded-full bg-[#eef2ff] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-[#6366f1]" />
                </div>
                <span className="text-xl font-bold tracking-tight text-text-primary">트러블슈팅</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base tracking-wider text-text-secondary font-semibold">총 {stats.autoGenCount}건</span>
                <button
                  onClick={() => setShowAiSection(prev => !prev)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI 자동 생성
                </button>
              </div>
            </div>

            {/* AI 트러블슈팅 자동 생성 섹션 */}
            {showAiSection && (
              <div className="mb-6 rounded-2xl px-7 py-6 border border-[#c7d2fe] relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #f5f3ff 0%, #eef2ff 100%)' }}>
                {/* 상단 보라 글로우 */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, #6366f1, #7c3aed, #6366f1)' }} />

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#6366f1]" />
                    <span className="text-lg font-bold text-text-primary">AI 트러블슈팅 자동 생성</span>
                    <span className="text-[10px] font-bold tracking-wider bg-[#6366f1] text-white px-2.5 py-0.5 rounded-full">Beta</span>
                  </div>
                  <span className="text-sm text-text-tertiary font-medium">마지막 분석: 3분 전</span>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed mb-1">
                  내 커밋 메시지, MR 설명, 코드 리뷰 내용을 AI가 분석하여 트러블슈팅 문서를 자동으로 초안 작성합니다.
                </p>
                <p className="text-sm text-text-secondary leading-relaxed mb-5">
                  생성 후 직접 수정·보완하여 포트폴리오로 활용할 수 있습니다.
                </p>

                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold border border-[#c7d2fe] bg-white text-text-primary">
                    <MessageSquare className="w-3.5 h-3.5 text-[#6366f1]" />
                    MR 리뷰 <span className="text-[#6366f1] font-bold">{stats.mrCount}건</span>
                  </span>
                </div>

                {/* MR 리스트 선택 */}
                {mrList.length > 0 && (
                  <div className="flex flex-col gap-1.5 mb-5 overflow-y-auto" style={{ maxHeight: Math.min(mrList.length, 4) * 46 }}>
                    {mrList.map((mr) => (
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

                <button
                  onClick={async () => {
                    if (!selectedMrId) return;
                    setAiGenerating(true);
                    try {
                      await generateTroubleshooting(selectedMrId);
                    } catch (err) {
                      console.error('트러블슈팅 생성 실패:', err);
                    } finally {
                      setAiGenerating(false);
                    }
                  }}
                  disabled={aiGenerating || !selectedMrId}
                  className="w-full py-3.5 rounded-xl text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}
                >
                  <Sparkles className="w-4 h-4" />
                  {aiGenerating ? '생성 중...' : '트러블슈팅 자동 생성하기'}
                </button>
              </div>
            )}

            {tsLoading ? (
              <div className="flex items-center justify-center py-12 text-text-tertiary">불러오는 중...</div>
            ) : tsList.length === 0 ? (
              <EmptyState message="아직 등록된 트러블슈팅이 없습니다." />
            ) : (
              <>
                <div className="flex flex-col gap-5">
                  {tsList.map(item => (
                    <TroubleshootingCard
                      key={item.id}
                      item={item}
                      onSave={(data) => updateTroubleshooting(item.id, data).catch(err => console.error('트러블슈팅 수정 실패:', err))}
                    />
                  ))}
                </div>

                {/* 페이지네이션 */}
                {tsTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      onClick={() => setTsPage(p => Math.max(0, p - 1))}
                      disabled={tsPage === 0}
                      className="text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                    {Array.from({ length: tsTotalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setTsPage(i)}
                        className={`w-10 h-10 rounded-full text-base font-bold transition-all ${
                          tsPage === i
                            ? 'bg-[#E8B931] text-[#1e1e2e] shadow-md'
                            : 'text-text-tertiary hover:text-text-primary'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setTsPage(p => Math.min(tsTotalPages - 1, p + 1))}
                      disabled={tsPage >= tsTotalPages - 1}
                      className="text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}

      {/* ── MR 리뷰 탭 ── */}
      {subTab === 'mr-review' && (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl px-8 py-8 border border-border bg-surface" style={{ boxShadow: '0 4px 16px 0 rgba(0,0,0,0.07), 0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 mt-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-soft)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
                    <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 0 1 2 2v7" /><line x1="6" y1="9" x2="6" y2="21" />
                  </svg>
                </div>
                <span className="text-xl font-bold tracking-tight text-text-primary">내 MR / 코드 리뷰</span>
              </div>
              <span className="text-base tracking-wider text-text-secondary text-extrabold">총 {stats.mrCount}건 · 받은 리뷰 {codeReviews}건</span>
            </div>
            {mrLoading ? (
              <div className="flex items-center justify-center py-12 text-text-tertiary">불러오는 중...</div>
            ) : mrList.length === 0 ? (
              <EmptyState message="아직 등록된 MR 리뷰가 없습니다." />
            ) : (
              <>
                <div className="flex flex-col gap-10">
                  {mrList.map(mr => <MrCard key={mr.id} mr={mr} />)}
                </div>

                {/* 페이지네이션 */}
                {mrTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      onClick={() => setMrPage(p => Math.max(0, p - 1))}
                      disabled={mrPage === 0}
                      className="text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                    {Array.from({ length: mrTotalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setMrPage(i)}
                        className={`w-10 h-10 rounded-full text-base font-bold transition-all ${
                          mrPage === i
                            ? 'bg-[#E8B931] text-[#1e1e2e] shadow-md'
                            : 'text-text-tertiary hover:text-text-primary'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setMrPage(p => Math.min(mrTotalPages - 1, p + 1))}
                      disabled={mrPage >= mrTotalPages - 1}
                      className="text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalSpace;