import { Wrench, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// ── 타입 ──────────────────────────────────────────────────────────────────────
type TroubleshootingStatus = 'resolved' | 'in_progress';

interface TroubleshootingItem {
  id: number;
  title: string;
  description: string;
  time: string;
  status: TroubleshootingStatus;
}

// ── 더미 데이터 ───────────────────────────────────────────────────────────────
const MOCK_TROUBLESHOOTINGS: TroubleshootingItem[] = [
  {
    id: 1,
    title: '무한 스크롤 메모리 누수',
    description: 'Intersection Observer API 최적화',
    time: '2일 전',
    status: 'resolved',
  },
  {
    id: 2,
    title: '초기 로딩 속도 개선',
    description: '번들 사이즈 최적화 진행 중',
    time: '5일 전',
    status: 'in_progress',
  },
];

// ── 아이템 카드 ────────────────────────────────────────────────────────────────
const TroubleshootingCard = ({ item }: { item: TroubleshootingItem }) => (
  <div className="flex items-start gap-3 bg-[rgba(169,144,72,0.09)] rounded-2xl px-4 py-4">
    <div className="flex-shrink-0 mt-0.5">
      {item.status === 'resolved' ? (
        <CheckCircle2 className="w-4 h-4 text-[#a99048]" />
      ) : (
        <AlertCircle className="w-4 h-4 text-[#a99048]" />
      )}
    </div>
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <h4 className="text-[14px] font-bold text-text-primary leading-snug">
        {item.title}
      </h4>
      <p className="text-[12px] text-text-secondary">{item.description}</p>
    </div>
    <span className="flex-shrink-0 text-[10px] text-text-tertiary">{item.time}</span>
  </div>
);

// ── 빈 상태 ────────────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-tertiary">
    <Wrench className="w-8 h-8 opacity-30" />
    <p className="text-sm">등록된 트러블슈팅이 없습니다.</p>
  </div>
);

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
const Troubleshooting = () => (
  <div className="bg-surface border-2 border-border rounded-3xl shadow-[2px_2px_2px_0px_rgba(0,0,0,0.05)] p-8 w-full h-full">
    {/* 섹션 헤더 */}
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-[20px] font-bold text-text-primary flex items-center gap-2">
        <Wrench className="w-5 h-5 text-text-primary" />
        <span>트러블슈팅</span>
      </h2>
      <Link
        to="/my-projects"
        className="text-text-tertiary hover:text-text-primary transition-colors"
        aria-label="트러블슈팅 전체보기"
      >
        <ChevronRight className="w-5 h-5" />
      </Link>
    </div>

    {/* 목록 */}
    {MOCK_TROUBLESHOOTINGS.length > 0 ? (
      <div className="flex flex-col gap-3">
        {MOCK_TROUBLESHOOTINGS.map((item) => (
          <TroubleshootingCard key={item.id} item={item} />
        ))}
      </div>
    ) : (
      <EmptyState />
    )}
  </div>
);

export default Troubleshooting;
