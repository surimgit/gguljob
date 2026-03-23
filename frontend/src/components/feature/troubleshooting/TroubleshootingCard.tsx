import { CheckCircle2, AlertCircle } from 'lucide-react';

// ── 타입 ──────────────────────────────────────────────────────────────────────
type TroubleshootingStatus = 'resolved' | 'in_progress';

interface TroubleshootingCardItem {
  id: number;
  title: string;
  description: string;
  date: string;
  status: TroubleshootingStatus;
  projectName: string;
}

// ── 상태별 스타일 ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  resolved: {
    borderColor: 'border-l-green-400',
    badgeBg: 'bg-success/[0.26] text-success',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: '해결완료',
  },
  in_progress: {
    borderColor: 'border-l-orange-400',
    badgeBg: 'bg-warning/[0.26] text-warning',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    label: '진행중',
  },
} as const;

// ── 카드 컴포넌트 ─────────────────────────────────────────────────────────────
const TroubleshootingCard = ({ item }: { item: TroubleshootingCardItem }) => {
  const style = STATUS_STYLES[item.status];

  return (
    <div
      className={`bg-surface ${style.borderColor} border-l-4 rounded-2xl px-6 py-5 flex flex-col gap-2 shadow-[2px_2px_8px_0px_rgba(0,0,0,0.08)] hover:bg-primary-soft hover:border-l-primary-hover transition-all duration-200`}
    >
      {/* 상단: 뱃지 + 날짜 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* 상태 뱃지 */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${style.badgeBg}`}
          >
            {style.icon}
            {style.label}
          </span>
          {/* 프로젝트 태그 */}
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-border text-text-secondary">
            {item.projectName}
          </span>
        </div>
        <span className="text-[12px] text-text-tertiary">{item.date}</span>
      </div>

      {/* 제목 */}
      <h3 className="text-[16px] font-bold text-text-primary leading-snug">
        {item.title}
      </h3>

      {/* 설명 */}
      <p className="text-[13px] font-base text-text-secondary leading-relaxed">
        {item.description}
      </p>
    </div>
  );
};

export type { TroubleshootingCardItem, TroubleshootingStatus };
export default TroubleshootingCard;
