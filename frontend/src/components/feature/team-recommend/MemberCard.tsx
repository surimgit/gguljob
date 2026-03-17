import { ChevronRight } from "lucide-react";

interface MemberCardProps {
  name: string;
  position: string;
  level: string;
  matchRate: number;
  introduction: string;
  techStacks: string[];
  profileImage: string;
  onClickProfile: () => void;
}

/* 포지션별 색상 */
const getPositionColor = (position: string) => {
  const lower = position.toLowerCase();
  if (lower.includes("backend") || lower === "be") return "var(--color-success)";
  if (lower.includes("frontend") || lower === "fe") return "var(--color-blue)";
  return "var(--color-primary-hover)";
};

/* 적합도별 색상 + 배경 */
const getMatchStyle = (rate: number) => {
  if (rate >= 70) return { color: "#22C55E", bg: "rgba(34,197,94,0.15)" };
  if (rate >= 30) return { color: "#F97316", bg: "rgba(249,115,22,0.15)" };
  return { color: "#EF4444", bg: "rgba(239,68,68,0.15)" };
};

const MemberCard = ({
  name,
  position,
  level,
  matchRate,
  introduction,
  techStacks,
  onClickProfile,
}: MemberCardProps) => {
  const posColor = getPositionColor(position);
  const matchStyle = getMatchStyle(matchRate);

  return (
    <button
      onClick={onClickProfile}
      className="flex flex-col w-full rounded-2xl p-5 text-left transition-all cursor-pointer shadow-md bg-surface hover:bg-primary-soft"
    >
      {/* 1행: 프로필 이미지 + 이름/포지션/숙련도 + 적합도 배지 */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
          style={{ background: "var(--color-primary-hover)" }}
        >
          {name.charAt(0)}
        </div>
        <div className="flex flex-col flex-1">
          <span
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {name}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className="text-sm font-bold px-1.0 py-0.5 rounded"
              style={{
                background: `${posColor}1a`,
                color: posColor,
              }}
            >
              {position}
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {level}
            </span>
          </div>
        </div>
        <span
          className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
          style={{
            background: matchStyle.bg,
            color: matchStyle.color,
          }}
        >
          적합도 {matchRate}%
        </span>
      </div>

      {/* 2행: 한줄 소개 */}
      <p
        className="text-sm font-medium leading-relaxed mb-5 line-clamp-2 whitespace-pre-line"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {introduction}
      </p>

      {/* 3행: 기술 스택 + 화살표 */}
      <div className="flex items-center">
        <div className="flex flex-wrap gap-1.5 flex-1">
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
        <ChevronRight
          className="w-6 h-6 flex-shrink-0 ml-2"
          style={{ color: "var(--color-text-brown)" }}
        />
      </div>
    </button>
  );
};

export default MemberCard;
