import { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';

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
          className="w-8 h-8 rounded-full text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0"
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

const TroubleshootingCard = ({ item }: { item: TroubleshootingItem }) => (
  <div className="flex flex-col border border-border rounded-2xl bg-surface overflow-hidden" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07), 0 1px 2px 0 rgba(0,0,0,0.04)' }}>
    {/* 번호 + 제목 */}
    <div className="flex items-center gap-3 px-4 py-4">
      <span className="w-7 h-7 rounded-full bg-[#1e1e2e] text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">
        {item.id}
      </span>
      <h4 className="text-[15px] font-bold tracking-tight text-text-primary leading-snug">{item.title}</h4>
    </div>

    {/* 문제 상황 */}
    <div className="flex flex-col gap-2 px-4 py-3 border-t border-border bg-background">
      <p className="text-[12px] font-semibold tracking-wide text-text-secondary flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
        문제 상황
      </p>
      <p className="text-[13px] tracking-wide text-text-secondary leading-relaxed">{item.problemDesc}</p>
    </div>

    {/* 해결 방법 */}
    <div className="flex flex-col gap-2 px-4 py-3 border-t border-border bg-background">
      <p className="text-[12px] font-semibold tracking-wide text-text-secondary flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        해결 방법
      </p>
      <p className="text-[13px] tracking-wide text-text-secondary leading-relaxed">{item.solutionDesc}</p>
      <pre className="bg-[#1e1e2e] text-[#a6e3a1] text-[12px] rounded-xl px-4 py-3 overflow-x-auto font-mono leading-relaxed">
        {item.codeSnippet}
      </pre>
    </div>

    {/* 출처 */}
    <div className="flex flex-col gap-2 px-4 py-3 border-t border-border bg-background">
      <p className="text-[12px] font-semibold tracking-wide text-text-secondary flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        출처
      </p>
      <div className="flex items-center gap-4">
        {item.sources.map((s, i) => (
          <span key={s.label} className="flex items-center gap-1.5 text-[13px] font-semibold text-text-primary">
            <span className="text-sm leading-none">{i === 0 ? '💛' : '🔄'}</span>
            {s.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-text-primary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          오준혁 리뷰
        </span>
      </div>
    </div>

    {/* 하단 버튼 */}
    <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border bg-surface">
      <span className="text-[12px] tracking-wide text-text-tertiary">3분 전 생성</span>
      <div className="flex gap-2 flex-shrink-0">
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold border border-border text-text-secondary bg-surface hover:bg-background transition-colors">
          ✏️ 수정
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold bg-[#1e1e2e] text-white hover:bg-[#2d2d3e] transition-colors">
          📤 포트폴리오
        </button>
      </div>
    </div>
  </div>
);

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export type PersonalSubTab = 'troubleshooting' | 'mr-review';

const PersonalSpace = ({ projectTitle, subTab = 'troubleshooting' }: { projectTitle?: string; subTab?: PersonalSubTab }) => {
  const userName = useAuthStore((s) => s.user?.name) ?? '김도현';
  const [mrPage, setMrPage] = useState(0);
  const MR_PER_PAGE = 3;
  const stats = { mrCount: 12, autoGenCount: 5 };
  const mrMessages = 12;
  const codeReviews = 34;

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
        <div className="grid grid-cols-[3fr_2fr] gap-5 items-start">
          {/* 좌측: AI 자동 생성 카드 */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl px-5 py-5 border border-[#c7d2fe]" style={{ background: '#f5f7ff', boxShadow: '0 4px 16px 0 rgba(99,102,241,0.10), 0 1px 3px 0 rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#eef2ff] flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-[#6366f1]" />
                  </div>
                  <span className="text-[16px] font-bold tracking-tight text-text-primary">AI 트러블슈팅 자동 생성</span>
                  <span className="text-[11px] font-bold tracking-wider bg-[#6366f1] text-white px-2.5 py-0.5 rounded-full">Beta</span>
                </div>
                <span className="text-[13px] tracking-wide text-text-tertiary">마지막 분석: 3분 전</span>
              </div>

              <p className="text-[14px] tracking-wide text-text-secondary leading-[2] mb-6">
                내 커밋 메시지, MR 설명, 코드 리뷰 내용을 AI가 분석하여 트러블슈팅 문서를 자동으로 초안 작성합니다.
                <br />생성 후 직접 수정·보완하여 포트폴리오로 활용할 수 있습니다.
              </p>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary flex-shrink-0">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  <span className="text-[14px] font-semibold tracking-wide text-text-secondary">MR 메시지</span>
                  <span className="text-[13px] font-bold tracking-wider text-[#6366f1] bg-[#eef2ff] px-2 py-0.5 rounded-full leading-none">{mrMessages}건</span>
                </div>
                <div className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary flex-shrink-0">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span className="text-[14px] font-semibold tracking-wide text-text-secondary">코드 리뷰</span>
                  <span className="text-[13px] font-bold tracking-wider text-[#6366f1] bg-[#eef2ff] px-2 py-0.5 rounded-full leading-none">{codeReviews}건</span>
                </div>
              </div>

              <button
                className="w-full py-3.5 rounded-xl text-[15px] font-bold tracking-wide text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 border-0 outline-none"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
              >
                <Sparkles className="w-4 h-4" />
                트러블슈팅 자동 생성하기
              </button>
            </div>
          </div>

          {/* 우측: 자동 생성 트러블슈팅 */}
          <div className="rounded-2xl px-3 py-4 border border-border bg-surface" style={{ boxShadow: '0 4px 16px 0 rgba(0,0,0,0.07), 0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-[#6366f1] flex-shrink-0" />
                <span className="text-[14px] font-bold tracking-tight text-text-primary whitespace-nowrap">자동 생성 트러블슈팅</span>
                <span className="text-[11px] font-semibold bg-[#f3f4f6] text-text-secondary px-1.5 py-0.5 rounded-full flex-shrink-0">{stats.autoGenCount}건</span>
              </div>
              <span className="text-[11px] font-bold tracking-wider bg-primary text-text-primary px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">AI 생성</span>
            </div>
            <div className="flex flex-col gap-4">
              {MOCK_TROUBLESHOOTINGS.map(item => <TroubleshootingCard key={item.id} item={item} />)}
            </div>
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
            <div className="flex flex-col gap-10">
              {MOCK_MR_LIST.slice(mrPage * MR_PER_PAGE, (mrPage + 1) * MR_PER_PAGE).map(mr => <MrCard key={mr.id} mr={mr} />)}
            </div>

            {/* 페이지네이션 */}
            {MOCK_MR_LIST.length > MR_PER_PAGE && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setMrPage(p => Math.max(0, p - 1))}
                  disabled={mrPage === 0}
                  className="text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                </button>
                {Array.from({ length: Math.ceil(MOCK_MR_LIST.length / MR_PER_PAGE) }, (_, i) => (
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
                  onClick={() => setMrPage(p => Math.min(Math.ceil(MOCK_MR_LIST.length / MR_PER_PAGE) - 1, p + 1))}
                  disabled={mrPage >= Math.ceil(MOCK_MR_LIST.length / MR_PER_PAGE) - 1}
                  className="text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalSpace;