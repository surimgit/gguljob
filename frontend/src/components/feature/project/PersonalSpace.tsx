import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import chatbotImg from '../../../assets/images/chatbot.png';
import type { PersonalSpaceData } from '../../../types/project';
import { generateTroubleshooting, updateTroubleshooting, chatTrouble } from '../../../api/troubleshooting';
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

// ── 더미 데이터 ───────────────────────────────────────────────────────────────
const MOCK_MR_LIST: MrItem[] = [
  {
    id: 1,
    title: 'feat: 트러블슈팅 상세 페이지 UI 구현 및 마크다운 렌더링 연동',
    status: 'Open',
    description: '트러블슈팅 상세 뷰에서 마크다운을 파싱하여 렌더링하는 기능을 구현했습니다. react-markdown 라이브러리 적용 과정에서 코드블록 하이라이팅 이슈가 있었고, rehype-highlight 플러그인으로 해결했습니다. SSR 환경에서 window is not defined 오류도 dynamic import로 처리했습니다.',
    branch: 'feature/troubleshoot-detail',
    commits: 4,
    time: '3분 전',
    reviews: [
      { author: '오준혁', role: 'Backend', comment: 'SSR에서 dynamic import 처리 잘 하셨는데, next/dynamic의 ssr: false 옵션도 같이 고려해보시면 좋을 것 같아요.', avatarColor: '#6366f1' },
      { author: '이준혁', role: 'Frontend', comment: 'rehype-highlight 대신 prism-react-renderer도 번들 사이즈 면에서 더 가벼울 수 있어요.', avatarColor: '#22c55e' },
      { author: '김도현', role: '본인 · 답변', comment: '말씀해주신 대로 next/dynamic ssr:false 적용하니 훨씬 깔끔해졌어요. prism-react-renderer도 다음 PR에서 교체해볼게요!', avatarColor: '#f59e0b' },
    ],
  },
  {
    id: 2,
    title: 'fix: 무한 스크롤 중복 데이터 렌더링 버그 수정',
    status: 'Merged',
    description: '커서 기반 페이지네이션에서 동일한 lastId가 두 번 요청되는 Race Condition 이슈를 발견했습니다. useRef로 요청 중 플래그를 관리하고, Intersection Observer 콜백에서 중복 호출을 방지하는 방식으로 해결했습니다.',
    branch: 'fix/infinite-scroll',
    commits: 2,
    time: '어제 병합',
    reviews: [
      { author: '정서윤', role: 'Frontend', comment: 'useRef 플래그 방식 좋은데, useSWR이나 react-query 쓰면 이런 중복 요청 처리가 내장되어 있어서 추후 리팩토링 고려해봐요.', avatarColor: '#ec4899' },
    ],
  },
  {
    id: 3,
    title: 'refactor: API 호출 로직 커스텀 훅으로 분리',
    status: 'Open',
    description: '컴포넌트에 직접 작성되어 있던 fetch 로직을 useApi 커스텀 훅으로 분리했습니다. 로딩, 에러, 데이터 상태를 통합 관리하고 재사용성을 높였습니다.',
    branch: 'refactor/custom-hook-api',
    commits: 3,
    time: '2시간 전',
    reviews: [
      { author: '오준혁', role: 'Backend', comment: 'API 에러 핸들링 시 HTTP 상태 코드별 분기 처리도 훅 내부에서 해주면 좋겠어요.', avatarColor: '#6366f1' },
      { author: '정서윤', role: 'Frontend', comment: '제네릭 타입 적용 깔끔하네요. AbortController도 cleanup에 추가하면 더 안정적일 것 같아요.', avatarColor: '#ec4899' },
    ],
  },
  {
    id: 4,
    title: 'feat: 다크모드 토글 및 테마 시스템 구현',
    status: 'Merged',
    description: 'CSS 변수 기반 테마 시스템을 구축하고, localStorage에 사용자 테마 설정을 저장하는 다크모드 토글 기능을 구현했습니다. prefers-color-scheme 미디어 쿼리로 시스템 설정도 반영됩니다.',
    branch: 'feature/dark-mode',
    commits: 5,
    time: '2일 전 병합',
    reviews: [
      { author: '이준혁', role: 'Frontend', comment: 'CSS 변수 네이밍이 일관성 있어서 좋아요. transition 추가하면 테마 전환이 더 부드러울 것 같아요.', avatarColor: '#22c55e' },
    ],
  },
  {
    id: 5,
    title: 'fix: 로그인 토큰 만료 시 자동 리다이렉트 미동작 수정',
    status: 'Closed',
    description: 'Axios interceptor에서 401 응답을 받았을 때 로그인 페이지로 리다이렉트가 되지 않는 버그를 수정했습니다. response interceptor의 에러 핸들링 순서가 잘못되어 있었습니다.',
    branch: 'fix/auth-redirect',
    commits: 1,
    time: '3일 전 닫힘',
    reviews: [
      { author: '오준혁', role: 'Backend', comment: 'refresh token 로직도 같이 추가하면 사용자 경험이 더 좋아질 것 같아요.', avatarColor: '#6366f1' },
      { author: '김도현', role: '본인 · 답변', comment: 'refresh token은 별도 MR로 진행하겠습니다. 우선 리다이렉트 버그만 수정했어요.', avatarColor: '#f59e0b' },
    ],
  },
];

const MOCK_TROUBLESHOOTINGS: TroubleshootingItem[] = [
  {
    id: 1,
    title: 'SSR 환경 마크다운 렌더링 window 오류',
    problemDesc: 'react-markdown + rehype-highlight 적용 시 SSR에서 window is not defined 오류 발생.',
    solutionDesc: 'next/dynamic으로 SSR 비활성화',
    codeSnippet: `const ReactMarkdown = dynamic(\n  () => import('react-markdown'),\n  { ssr: false }\n)`,
    sources: [
      { label: 'PR #230512', color: '#3b82f6' },
      { label: 'MR #11', color: '#8b5cf6' },
    ],
  },
  {
    id: 2,
    title: '무한 스크롤 Race Condition 해결',
    problemDesc: 'Intersection Observer 중복 호출로 Race Condition 발생. API 요청이 두 번 실행됨.',
    solutionDesc: 'useRef로 isFetching 플래그 관리',
    codeSnippet: `const isFetching = useRef(false)\nif (!isFetching.current) {\n  isFetching.current = true\n  await fetchNextPage()\n  isFetching.current = false\n}`,
    sources: [
      { label: 'PR #c6b8152', color: '#3b82f6' },
      { label: 'MR #10', color: '#8b5cf6' },
    ],
  },
];

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

const PersonalSpace = ({ projectTitle, personalData, subTab = 'troubleshooting' }: { projectTitle?: string; personalData?: PersonalSpaceData | null; subTab?: PersonalSubTab }) => {
  const userName = useAuthStore((s) => s.user?.name) ?? '김도현';
  const [mrPage, setMrPage] = useState(0);
  const [tsPage, setTsPage] = useState(0);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [selectedMrId, setSelectedMrId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const chatbotRef = useRef<HTMLDivElement>(null);
  const MR_PER_PAGE = 3;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (chatbotRef.current && !chatbotRef.current.contains(e.target as Node)) {
        setChatbotOpen(false);
        setGenerating(false);
      }
    };
    if (chatbotOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [chatbotOpen]);

  const mrList: MrItem[] = personalData
    ? personalData.myPullRequests.map(pr => ({
        id: pr.prId,
        title: pr.title,
        status: pr.status as MrStatus,
        description: '',
        branch: `#${pr.prNumber}`,
        commits: 0,
        time: new Date(pr.githubCreatedAt).toLocaleDateString(),
        reviews: [],
      }))
    : MOCK_MR_LIST;

  const tsList: TroubleshootingItem[] = personalData
    ? personalData.myTroubleshootings.map(ts => ({
        id: ts.tsId,
        title: ts.title,
        problemDesc: ts.situation,
        solutionDesc: '',
        codeSnippet: '',
        sources: [],
      }))
    : MOCK_TROUBLESHOOTINGS;

  const mrCount = personalData ? personalData.stats.prCount : MOCK_MR_LIST.length;
  const codeReviews = personalData ? personalData.stats.reviewCount : MOCK_MR_LIST.reduce((sum, mr) => sum + mr.reviews.length, 0);
  const stats = { mrCount, autoGenCount: personalData ? personalData.stats.troubleshootingCount : MOCK_TROUBLESHOOTINGS.length };

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
              <span className="text-text-secondary">Frontend Developer · </span>
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
              <span className="text-base tracking-wider text-text-secondary font-semibold">총 {stats.autoGenCount}건</span>
            </div>
            {tsList.length === 0 ? (
              <EmptyState message="아직 등록된 트러블슈팅이 없습니다." />
            ) : (
              <>
                <div className="flex flex-col gap-5">
                  {tsList.slice(tsPage * MR_PER_PAGE, (tsPage + 1) * MR_PER_PAGE).map(item => (
                    <TroubleshootingCard
                      key={item.id}
                      item={item}
                      onSave={(data) => updateTroubleshooting(item.id, data).catch(err => console.error('트러블슈팅 수정 실패:', err))}
                    />
                  ))}
                </div>

                {/* 페이지네이션 */}
                {(
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      onClick={() => setTsPage(p => Math.max(0, p - 1))}
                      disabled={tsPage === 0}
                      className="text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                    {Array.from({ length: Math.ceil(tsList.length / MR_PER_PAGE) }, (_, i) => (
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
                      onClick={() => setTsPage(p => Math.min(Math.ceil(tsList.length / MR_PER_PAGE) - 1, p + 1))}
                      disabled={tsPage >= Math.ceil(tsList.length / MR_PER_PAGE) - 1}
                      className="text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 챗봇 캐릭터 버튼 */}
          <button
            onClick={() => {
              if (!chatbotOpen) chatTrouble().catch(err => console.error('챗봇 호출 실패:', err));
              setChatbotOpen(prev => !prev);
            }}
            className="fixed bottom-8 right-8 w-40 h-40 hover:scale-110 z-40 overflow-hidden border-0 bg-transparent animate-float"
          >
            <img src={chatbotImg} alt="AI 챗봇" className="w-full h-full object-cover" />
          </button>

          {/* 챗봇 팝업 */}
          {chatbotOpen && (
            <div ref={chatbotRef} className="fixed bottom-15 right-44 w-[440px] h-[520px] z-50 rounded-2xl border border-[#c7d2fe] overflow-hidden shadow-2xl flex flex-col" style={{ background: '#f5f7ff' }}>
              {/* 헤더 */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#c7d2fe]" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="text-base font-bold text-white">AI 트러블슈팅 자동 생성</span>
                  <span className="text-[10px] font-bold tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">Beta</span>
                </div>
                <button onClick={() => { setGenerating(false); setChatbotOpen(false); }} className="text-white/70 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 본문 */}
              {generating ? (
                <div className="relative px-6 flex-1 flex flex-col items-center justify-center gap-5">
                  <button
                    onClick={() => setGenerating(false)}
                    className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-[#f3f4f6] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-36 h-36 overflow-hidden">
                    <img src={chatbotImg} alt="AI" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xl font-bold text-text-primary">트러블슈팅 생성 중...</span>
                    <span className="text-base text-text-secondary">MR 리뷰를 분석하고 있습니다</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] animate-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] animate-pulse" style={{ animationDelay: '300ms' }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1] animate-pulse" style={{ animationDelay: '600ms' }} />
                  </div>
                </div>
              ) : (
                <div className="px-6 pt-7 pb-6 flex-1 flex flex-col gap-5">
                  <div className="flex items-start gap-0.5">
                    <div className="w-20 h-14 overflow-hidden flex-shrink-0">
                      <img src={chatbotImg} alt="AI" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-4 border border-border">
                      <p className="text-sm text-text-secondary leading-relaxed">
                        MR 리뷰를 AI가 분석하여 트러블슈팅 초안을 자동으로 생성합니다.
                        <br />생성 후 직접 수정 · 보완하여 포트폴리오로 활용할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-bold text-text-primary">MR 리뷰</span>
                    <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                      {mrList.map((mr) => (
                        <label
                          key={mr.id}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors border ${
                            selectedMrId === mr.id
                              ? 'bg-[#eef2ff] border-[#c7d2fe]'
                              : 'bg-white border-border hover:bg-[#f9fafb]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="mr-select"
                            checked={selectedMrId === mr.id}
                            onChange={() => setSelectedMrId(mr.id)}
                            className="accent-[#6366f1] w-4 h-4 flex-shrink-0"
                          />
                          <span className="text-sm text-text-secondary truncate">{mr.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (!selectedMrId) return;
                      setGenerating(true);
                      try {
                        await generateTroubleshooting(selectedMrId);
                      } catch (err) {
                        console.error('트러블슈팅 생성 실패:', err);
                        setGenerating(false);
                      }
                    }}
                    className="w-full py-4 mt-2 rounded-xl text-sm font-bold tracking-wide text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 border-0 outline-none"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                  >
                    <Sparkles className="w-4 h-4" />
                    트러블슈팅 자동 생성하기
                  </button>
                </div>
              )}
            </div>
          )}
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
            {mrList.length === 0 ? (
              <EmptyState message="아직 등록된 MR 리뷰가 없습니다." />
            ) : (
              <>
                <div className="flex flex-col gap-10">
                  {mrList.slice(mrPage * MR_PER_PAGE, (mrPage + 1) * MR_PER_PAGE).map(mr => <MrCard key={mr.id} mr={mr} />)}
                </div>

                {/* 페이지네이션 */}
                {(
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      onClick={() => setMrPage(p => Math.max(0, p - 1))}
                      disabled={mrPage === 0}
                      className="text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                    {Array.from({ length: Math.ceil(mrList.length / MR_PER_PAGE) }, (_, i) => (
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
                      onClick={() => setMrPage(p => Math.min(Math.ceil(mrList.length / MR_PER_PAGE) - 1, p + 1))}
                      disabled={mrPage >= Math.ceil(mrList.length / MR_PER_PAGE) - 1}
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