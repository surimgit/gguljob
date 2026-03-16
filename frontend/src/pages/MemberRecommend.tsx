import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RecommendCard from "../components/feature/team-recommend/RecommendCard";
import MemberCard from "../components/feature/team-recommend/MemberCard";
import MemberProfileModal from "../components/feature/team-recommend/MemberProfileModal";
import type { ProfileUser, ProfileProject } from "../components/feature/mypage/ProfileModalLayout";
import beeImg from "../assets/images/memberfind.png";

/* ── 타입 정의 ── */
interface MemberData {
  id: string;
  name: string;
  position: string;
  level: string;
  matchRate: number;
  introduction: string;
  techStacks: string[];
  profileImage: string;
  projects: ProfileProject[];
}

/* ── 필터 옵션 ── */
const POSITION_FILTERS = ["전체", "Frontend", "Backend", "Full Stack", "DevOps"];
const LEVEL_FILTERS = ["전체", "초급", "중급", "고급"];

/* ── 목 프로젝트 데이터 ── */
const MOCK_PROJECTS: ProfileProject[] = [
  {
    id: "p1",
    name: "MatchUp",
    description: "AI 기반 실시간 매칭 플랫폼 서비스",
    emoji: "🎯",
    bgColor: "amber" as const,
    myRole: "프론트엔드 리드",
    period: "2025.01 - 2025.03",
    techStacks: ["React", "TypeScript", "Next.js"],
  },
  {
    id: "p2",
    name: "StudyMate",
    description: "스터디 그룹 매칭 및 학습 관리 플랫폼",
    emoji: "🚀",
    bgColor: "green" as const,
    myRole: "프론트엔드 개발",
    period: "2024.09 - 2024.12",
    techStacks: ["Next.js", "Python"],
  },
];

/* ── 목 데이터 ── */
const MOCK_RECOMMENDED: MemberData[] = [
  {
    id: "r1",
    name: "이서준",
    position: "Backend",
    level: "고급",
    matchRate: 95,
    introduction: "Spring Boot와 JPA 기반 API 설계 경험 2년\n최근 MSA 전환 프로젝트에 참여",
    techStacks: ["Spring Boot", "MySQL", "Docker"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
  {
    id: "r2",
    name: "이서준",
    position: "Backend",
    level: "고급",
    matchRate: 95,
    introduction: "Spring Boot와 JPA 기반 API 설계 경험 2년\n최근 MSA 전환 프로젝트에 참여",
    techStacks: ["Spring Boot", "MySQL", "Docker"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
  {
    id: "r3",
    name: "이서준",
    position: "Backend",
    level: "고급",
    matchRate: 95,
    introduction: "Spring Boot와 JPA 기반 API 설계 경험 2년\n최근 MSA 전환 프로젝트에 참여",
    techStacks: ["Spring Boot", "MySQL", "Docker"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
];

const MOCK_MEMBERS: MemberData[] = [
  {
    id: "m1",
    name: "강선관",
    position: "Frontend",
    level: "고급",
    matchRate: 95,
    introduction: "React/TypeScript 기반 SPA 개발 경험\nUI/UX에 관심이 많고 디자인 시스템 구축 경험 보유",
    techStacks: ["Python", "FastAPI", "PostgreSQL", "BackEndTech"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
  {
    id: "m2",
    name: "박도현",
    position: "Frontend",
    level: "고급",
    matchRate: 89,
    introduction: "대규모 트래픽 처리 경험 보유\n실시간 데이터 파이프라인 및 데이터 최적화 전문",
    techStacks: ["Python", "FastAPI", "PostgreSQL", "BackEndTech"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
  {
    id: "m3",
    name: "강선관",
    position: "Frontend",
    level: "고급",
    matchRate: 63,
    introduction: "React/TypeScript 기반 SPA 개발 경험\nUI/UX에 관심이 많고 디자인 시스템 구축 경험 보유",
    techStacks: ["Python", "FastAPI", "PostgreSQL", "BackEndTech"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
  {
    id: "m4",
    name: "박도현",
    position: "Frontend",
    level: "고급",
    matchRate: 89,
    introduction: "대규모 트래픽 처리 경험 보유\n실시간 데이터 파이프라인 및 검색 넣단 최적화 전문",
    techStacks: ["Python", "FastAPI", "PostgreSQL", "BackEndTech"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
  {
    id: "m5",
    name: "강선관",
    position: "Frontend",
    level: "고급",
    matchRate: 95,
    introduction: "React/TypeScript 기반 SPA 개발 경험\nUI/UX에 관심이 많고 디자인 시스템 구축 경험 보유",
    techStacks: ["Python", "FastAPI", "PostgreSQL", "BackEndTech"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
  {
    id: "m6",
    name: "강선관",
    position: "Frontend",
    level: "고급",
    matchRate: 23,
    introduction: "React/TypeScript 기반 SPA 개발 경험\nUI/UX에 관심이 많고 디자인 시스템 구축 경험 보유",
    techStacks: ["Python", "FastAPI", "PostgreSQL", "BackEndTech"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
  {
    id: "m7",
    name: "강선관",
    position: "Frontend",
    level: "고급",
    matchRate: 95,
    introduction: "React/TypeScript 기반 SPA 개발 경험\nUI/UX에 관심이 많고 디자인 시스템 구축 경험 보유",
    techStacks: ["Python", "FastAPI", "PostgreSQL", "BackEndTech"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
  {
    id: "m8",
    name: "박도현",
    position: "Frontend",
    level: "고급",
    matchRate: 89,
    introduction: "대규모 트래픽 처리 경험 보유\n실시간 데이터 파이프라인 및 검색 넣단 최적화 전문",
    techStacks: ["Python", "FastAPI", "PostgreSQL", "BackEndTech"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
  {
    id: "m9",
    name: "강선관",
    position: "Frontend",
    level: "고급",
    matchRate: 95,
    introduction: "React/TypeScript 기반 SPA 개발 경험\nUI/UX에 관심이 많고 디자인 시스템 구축 경험 보유",
    techStacks: ["Python", "FastAPI", "PostgreSQL", "BackEndTech"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
  {
    id: "m10",
    name: "강선관",
    position: "Frontend",
    level: "고급",
    matchRate: 95,
    introduction: "React/TypeScript 기반 SPA 개발 경험\nUI/UX에 관심이 많고 디자인 시스템 구축 경험 보유",
    techStacks: ["Python", "FastAPI", "PostgreSQL", "BackEndTech"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
  {
    id: "m11",
    name: "박도현",
    position: "Frontend",
    level: "고급",
    matchRate: 89,
    introduction: "대규모 트래픽 처리 경험 보유\n실시간 데이터 파이프라인 및 검색 넣단 최적화 전문",
    techStacks: ["Python", "FastAPI", "PostgreSQL", "BackEndTech"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
  {
    id: "m12",
    name: "강선관",
    position: "Frontend",
    level: "고급",
    matchRate: 95,
    introduction: "React/TypeScript 기반 SPA 개발 경험\nUI/UX에 관심이 많고 디자인 시스템 구축 경험 보유",
    techStacks: ["Python", "FastAPI", "PostgreSQL", "BackEndTech"],
    profileImage: "",
    projects: MOCK_PROJECTS,
  },
];

const ITEMS_PER_PAGE = 6;

const MemberRecommend = () => {
  const [positionFilter, setPositionFilter] = useState("전체");
  const [levelFilter, setLevelFilter] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<ProfileUser | null>(null);

  // 필터 적용
  const filtered = MOCK_MEMBERS.filter((m) => {
    if (positionFilter !== "전체" && m.position !== positionFilter) return false;
    if (levelFilter !== "전체" && m.level !== levelFilter) return false;
    return true;
  });

  // 상단 추천 3명
  const topRecommended = MOCK_RECOMMENDED;

  // 하단 목록 페이지네이션
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClickProfile = (member: typeof MOCK_MEMBERS[0]) => {
    setSelectedUser({
      id: member.id,
      name: member.name,
      role: member.position,
      bio: member.introduction,
      techStacks: member.techStacks,
      projects: member.projects,
    });
  };

  return (
    <div
      className="min-h-screen pb-16"
      style={{ background: "var(--color-background)" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 페이지 타이틀 */}
        <h1
          className="text-2xl font-bold mb-3"
          style={{ color: "var(--color-text-primary)" }}
        >
          팀원 찾기
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: "var(--color-text-secondary)" }}
        >
          내 프로젝트에 가장 적합한 팀원을 추천합니다
        </p>

        {/* ── 히어로 배너 ── */}
        <div
          className="relative rounded-2xl px-6 pt-10 pb-6 mb-6 overflow-hidden"
          style={{ background: "var(--color-background)", border: "2px solid var(--color-border)" }}
        >
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-start gap-3">
              <div>
                <p
                  className="text-xl font-bold mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  이 팀원들과 잘 맞을 것 같아요 ✨
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  프로젝트와 성향에 적합한 맞춤형 팀원을 추천드려요!
                </p>
              </div>
            </div>
            <img
              src={beeImg}
              alt="팀빌딩"
              className="absolute right-0 bottom-0 h-45 object-contain"
            />
          </div>

          {/* ── 필터 ── */}
          <div
            className="flex flex-col gap-3 w-full rounded-b-xl px-5 py-4 -mx-6 -mb-6"
            style={{ background: "var(--color-border)", width: "calc(100% + 48px)" }}
          >
          {/* 포지션 필터 */}
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold mr-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              포지션
            </span>
            {POSITION_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { setPositionFilter(f); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                style={{
                  background: positionFilter === f ? "var(--color-primary-hover)" : "transparent",
                  color: positionFilter === f ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  border: "none",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <hr className="border-t" style={{ borderColor: "var(--color-primary)" }} />

          {/* 숙련도 필터 */}
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold mr-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              숙련도
            </span>
            {LEVEL_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { setLevelFilter(f); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                style={{
                  background: levelFilter === f ? "var(--color-primary-hover)" : "transparent",
                  color: levelFilter === f ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  border: "none",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* ── 상단 추천 카드 ── */}
        <div className="flex gap-4 overflow-x-auto pb-4 mb-10">
          {topRecommended.map((m, idx) => (
            <RecommendCard
              key={`recommend-${idx}`}
              {...m}
              onClickProfile={() => handleClickProfile(m)}
            />
          ))}
        </div>

        {/* ── 하단 팀원 목록 ── */}
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: "var(--color-text-primary)" }}
        >
          팀원 목록
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {paged.map((m, idx) => (
            <MemberCard
              key={`${m.name}-${idx}`}
              {...m}
              onClickProfile={() => handleClickProfile(m)}
            />
          ))}
        </div>

        {/* ── 페이지네이션 ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{
                color: currentPage === 1 ? "var(--color-text-tertiary)" : "var(--color-text-primary)",
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: currentPage === page ? "var(--color-primary)" : "transparent",
                  color: currentPage === page ? "white" : "var(--color-text-secondary)",
                }}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{
                color: currentPage === totalPages ? "var(--color-text-tertiary)" : "var(--color-text-primary)",
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── 프로필 모달 ── */}
      {selectedUser && (
        <MemberProfileModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default MemberRecommend;
