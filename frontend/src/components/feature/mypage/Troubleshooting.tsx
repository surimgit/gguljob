import { useState, useEffect } from 'react';
import { Wrench, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionEmptyState } from '../../common';
import { getMyTroubleshootingWidget, type TroubleshootingWidget } from '../../../api/troubleshooting';

// ── 시간 포맷 ────────────────────────────────────────────────────────────────
const formatTimeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}개월 전`;
};

// ── 아이템 카드 ────────────────────────────────────────────────────────────────
const TroubleshootingCard = ({ item }: { item: TroubleshootingWidget }) => (
  <div className="flex items-start gap-3 bg-[rgba(169,144,72,0.09)] rounded-2xl px-4 py-4">
    <div className="flex-shrink-0 mt-0.5">
      <CheckCircle2 className="w-4 h-4 text-[#a99048]" />
    </div>
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <h4 className="text-[14px] font-bold text-text-primary leading-snug">
        {item.title}
      </h4>
      <p className="text-[12px] text-text-secondary line-clamp-1">{item.solution}</p>
    </div>
    <span className="flex-shrink-0 text-[10px] text-text-tertiary">{formatTimeAgo(item.createdAt)}</span>
  </div>
);

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
const Troubleshooting = () => {
  const [items, setItems] = useState<TroubleshootingWidget[]>([]);

  useEffect(() => {
    getMyTroubleshootingWidget()
      .then(({ data }) => {
        setItems(data.data ?? []);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="bg-surface border-2 border-border rounded-3xl shadow-[2px_2px_2px_0px_rgba(0,0,0,0.05)] p-8 w-full h-full flex flex-col">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[20px] font-bold text-text-primary flex items-center gap-2">
          <Wrench className="w-5 h-5 text-text-primary" />
          <span>트러블슈팅</span>
        </h2>
        <Link
          to="/mypage/troubleshooting"
          className="text-text-tertiary hover:text-text-primary transition-colors"
          aria-label="트러블슈팅 전체보기"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      {/* 목록 */}
      <div className="flex-1">
        {items.length > 0 ? (
          <div className="flex flex-col gap-3">
            {items.slice(0, 3).map((item) => (
              <TroubleshootingCard key={item.tsId} item={item} />
            ))}
          </div>
        ) : (
          <SectionEmptyState message="등록된 트러블슈팅이 없습니다." />
        )}
      </div>
    </div>
  );
};

export default Troubleshooting;
