import { ChevronRight } from "lucide-react";
import { getRoleDisplayName, getRoleColor } from "../../../constants/skills";

interface RecommendCardProps {
  name: string;
  position: string;
  level: string;
  matchRate: number;
  introduction: string;
  techStacks: string[];
  profileImage: string;
  onClickProfile: () => void;
}

/* 적합도별 색상 + 배경 */
const getMatchStyle = (rate: number) => {
  if (rate >= 70) return { color: "#22C55E", bg: "rgba(34,197,94,0.15)" };
  if (rate >= 30) return { color: "#F97316", bg: "rgba(249,115,22,0.15)" };
  return { color: "#EF4444", bg: "rgba(239,68,68,0.15)" };
};

const RecommendCard = ({
  name,
  position,
  level,
  matchRate,
  introduction,
  techStacks,
  onClickProfile,
}: RecommendCardProps) => {
  const posColor = getRoleColor(position);
  const matchStyle = getMatchStyle(matchRate);

  return (
    <div
      className="relative flex flex-col rounded-2xl p-5 min-h-[280px] shadow-md border border-border hover:bg-primary-soft hover:border-primary-hover transition-all duration-200"
      style={{
        background: "rgba(var(--color-primary-soft-rgb, 255,243,200), 0.23)",
      }}
    >
      {/* 적합도 배지 (우상단) */}
      <span
        className="absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full"
        style={{
          background: matchStyle.bg,
          color: matchStyle.color,
        }}
      >
        적합도 {matchRate}%
      </span>

      {/* 프로필 아바타/이름/포지션 */}
      <div className="flex items-center gap-3 mt-3 mb-5 pr-24">
        <div
          className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
          style={{ background: "var(--color-primary-hover)" }}
        >
          {name.charAt(0)}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span
            className="text-lg font-bold truncate"
            style={{ color: "var(--color-text-primary)" }}
          >
            {name}
          </span>
          <div className="flex flex-wrap items-center gap-1.5 -ml-1">
            <span
              className="text-sm font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
              style={{
                background: `${posColor}1a`,
                color: posColor,
              }}
            >
              {getRoleDisplayName(position)}
            </span>
            <span
              className="text-xs font-bold whitespace-nowrap"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {level}
            </span>
          </div>
        </div>
      </div>

      {/* 한줄 소개 */}
      <p
        className="text-sm font-medium leading-relaxed mb-8 line-clamp-2 whitespace-pre-line"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {introduction}
      </p>

      {/* 기술 스택 */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        {techStacks.map((stack) => (
          <span
            key={stack}
            className="text-sm font-semibold px-2.5 py-1 rounded"
            style={{
              background: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            {stack}
          </span>
        ))}
      </div>

      {/* 프로필 보기 버튼 */}
      <button
        onClick={onClickProfile}
        className="mt-auto mx-auto px-13 py-3 rounded-xl text-base font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer bg-primary hover:bg-primary-hover text-white"
      >
        프로필 보기
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default RecommendCard;
