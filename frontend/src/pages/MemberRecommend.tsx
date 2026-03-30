import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import Pagination from "../components/common/Pagination";
import RecommendCard from "../components/feature/team-recommend/RecommendCard";
import MemberCard from "../components/feature/team-recommend/MemberCard";
import MemberProfileModal from "../components/feature/team-recommend/MemberProfileModal";
import type { ProfileUser } from "../components/feature/mypage/ProfileModalLayout";
import beeImg from "../assets/images/memberfind.png";
import { getRecommendedMembers, getRecommendedMembersTop, getProjectMembers } from "../api/projects";
import type { RecommendedMember } from "../api/projects";
import { ROLE_DISPLAY_NAMES, ROLE_TO_API, API_TO_ROLE, DISPLAY_TO_ROLE, SKILL_NAMES, type RoleCode } from "../constants/skills";

/* ── 필터 옵션 ── */
const POSITION_FILTERS = [
  { label: "전체", value: "" },
  ...(Object.entries(ROLE_DISPLAY_NAMES) as [RoleCode, string][]).map(([code, label]) => ({
    label,
    value: ROLE_TO_API[code],
  })),
];

const LEVEL_FILTERS = [
  { label: "전체", value: "" },
  { label: "입문", value: "BEGINNER" },
  { label: "초급", value: "JUNIOR" },
  { label: "중급", value: "MID_LEVEL" },
  { label: "고급", value: "SENIOR" },
];

const ITEMS_PER_PAGE = 6;

const sortBySkillOrder = (skills: string[]) =>
  [...skills].sort((a, b) => {
    const idxA = SKILL_NAMES.indexOf(a);
    const idxB = SKILL_NAMES.indexOf(b);
    return (idxA === -1 ? Infinity : idxA) - (idxB === -1 ? Infinity : idxB);
  });

const toCardData = (m: RecommendedMember) => ({
  id: String(m.userId),
  name: m.userName,
  position: m.position ?? null,
  level: m.experienceLevel ?? null,
  matchRate: m.matchScore,
  introduction: m.bio,
  techStacks: sortBySkillOrder(m.skills),
  profileImage: m.profileImageUrl ?? "",
});

/* API 응답 한글 경력값 → enum 코드 */
const LEVEL_DESC_TO_ENUM: Record<string, string> = {
  "초급":        "BEGINNER",
  "중급(주니어)": "JUNIOR",
  "중급(미들)":   "MID_LEVEL",
  "고급":        "SENIOR",
};

const normalizeLevel = (level: string | null | undefined): string => {
  if (!level) return "";
  return LEVEL_DESC_TO_ENUM[level] ?? level;
};

/**
 * API 응답의 position 값을 ROLE_TO_API 형식(예: "BE", "FE")으로 통일
 * - API enum 값("BE", "FE" 등)은 그대로 반환
 * - 표시명("Backend", "Frontend" 등)은 DISPLAY_TO_ROLE → ROLE_TO_API 로 변환
 */
const normalizePosition = (pos: string | null | undefined): string => {
  if (!pos) return "";
  if (API_TO_ROLE[pos]) return pos;                        // 이미 API enum 값
  const byDisplay = DISPLAY_TO_ROLE[pos];
  if (byDisplay) return ROLE_TO_API[byDisplay];            // 표시명 → API enum 값
  return pos;
};

const MemberRecommend = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const projectTitle = (location.state as { projectTitle?: string } | null)?.projectTitle;

  const [positionFilters, setPositionFilters] = useState<string[]>([]);
  const [levelFilters, setLevelFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<ProfileUser | null>(null);

  const [topMembers, setTopMembers] = useState<RecommendedMember[]>([]);
  const [allMembers, setAllMembers] = useState<RecommendedMember[]>([]);
  const [teamMemberIds, setTeamMemberIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* 현재 팀원 userId 목록 조회 */
  useEffect(() => {
    if (!projectId) return;
    getProjectMembers(Number(projectId))
      .then(({ data }: { data: any }) => {
        const list = data.data ?? data;
        if (Array.isArray(list)) {
          setTeamMemberIds(new Set(list.map((m: { userId: number }) => m.userId)));
        }
      })
      .catch(() => {});
  }, [projectId]);

  /* Top 3 추천 */
  useEffect(() => {
    if (!projectId) return;
    getRecommendedMembersTop(Number(projectId))
      .then(({ data }: { data: any }) => {
        const list = data.data ?? data;
        setTopMembers(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, [projectId]);

  /* 전체 목록 1회 로드 */
  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    getRecommendedMembers(Number(projectId), { page: 0, size: 100 })
      .then(({ data }: { data: any }) => {
        const res = data.data ?? data;
        const content = res.content ?? res;
        setAllMembers(Array.isArray(content) ? content : []);
      })
      .catch(() => setError("팀원 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [projectId]);

  const togglePosition = (value: string) => {
    setPositionFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
    setCurrentPage(1);
  };

  const toggleLevel = (value: string) => {
    setLevelFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
    setCurrentPage(1);
  };

  /* 클라이언트 사이드 필터링 */
  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allMembers.filter((m) => {
      if (teamMemberIds.has(m.userId)) return false;
      if (positionFilters.length > 0) {
        const memberPos = normalizePosition(m.position);
        if (!positionFilters.includes(memberPos)) return false;
      }
      if (levelFilters.length > 0 && !levelFilters.includes(normalizeLevel(m.experienceLevel))) return false;
      if (q) {
        const nameMatch = m.userName.toLowerCase().includes(q);
        const posMatch = (m.position ?? "").toLowerCase().includes(q);
        if (!nameMatch && !posMatch) return false;
      }
      return true;
    });
  }, [allMembers, teamMemberIds, positionFilters, levelFilters, searchQuery]);

  const handleClickProfile = (card: ReturnType<typeof toCardData>) => {
    setSelectedUser({
      id: card.id,
      name: card.name,
      role: card.position,
      bio: card.introduction,
      avatarUrl: card.profileImage || undefined,
      techStacks: card.techStacks,
      projects: [],
    });
  };

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE) || 1;
  const paged = filteredMembers
    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    .map(toCardData);

  const topCards = topMembers.filter(m => !teamMemberIds.has(m.userId)).map(toCardData);

  return (
    <div
      className="min-h-screen pb-16"
      style={{ background: "var(--color-background)" }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 타이틀 */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(`/my-projects/${projectId}?tab=members`)}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            팀원 찾기
          </h1>
        </div>
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
              className="absolute right-0 bottom-0 h-50 xl:h-50 object-contain hidden xl:block pointer-events-none"
            />
          </div>

          {/* ── 필터 ── */}
          <div
            className="flex flex-col gap-3 w-full rounded-b-xl px-5 py-4 -mx-6 -mb-6"
            style={{ background: "var(--color-border)", width: "calc(100% + 48px)" }}
          >
          {/* 포지션 필터 */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-sm font-semibold mr-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              포지션
            </span>
            {/* 전체: 아무것도 선택 안 됐을 때 활성 */}
            <button
              onClick={() => { setPositionFilters([]); setCurrentPage(1); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{
                background: positionFilters.length === 0 ? "var(--color-primary-hover)" : "transparent",
                color: positionFilters.length === 0 ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                border: "none",
              }}
            >
              전체
            </button>
            {POSITION_FILTERS.filter((f) => f.value !== "").map((f) => {
              const active = positionFilters.includes(f.value);
              return (
                <button
                  key={f.value}
                  onClick={() => togglePosition(f.value)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    background: active ? "var(--color-primary-hover)" : "transparent",
                    color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                    border: "none",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <hr className="border-t" style={{ borderColor: "var(--color-primary)" }} />

          {/* 숙련도 필터 */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-sm font-semibold mr-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              숙련도
            </span>
            <button
              onClick={() => { setLevelFilters([]); setCurrentPage(1); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{
                background: levelFilters.length === 0 ? "var(--color-primary-hover)" : "transparent",
                color: levelFilters.length === 0 ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                border: "none",
              }}
            >
              전체
            </button>
            {LEVEL_FILTERS.filter((f) => f.value !== "").map((f) => {
              const active = levelFilters.includes(f.value);
              return (
                <button
                  key={f.value}
                  onClick={() => toggleLevel(f.value)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    background: active ? "var(--color-primary-hover)" : "transparent",
                    color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                    border: "none",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          </div>
        </div>

        {/* ── 상단 추천 카드 Top 3 ── */}
        {topCards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 mb-10">
            {topCards.map((m, idx) => (
              <RecommendCard
                key={`recommend-${idx}`}
                {...m}
                onClickProfile={() => handleClickProfile(m)}
              />
            ))}
          </div>
        )}

        {/* ── 하단 팀원 목록 ── */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            팀원 목록
          </h2>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: "var(--color-background)",
              border: "1px solid var(--color-border)",
              width: "240px",
            }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-text-tertiary)" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="이름, 포지션 검색"
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: "var(--color-text-primary)" }}
            />
          </div>
        </div>

        {/* 로딩 / 에러 / 빈 상태 */}
        {loading && (
          <p className="text-center py-12 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            불러오는 중...
          </p>
        )}
        {error && (
          <p className="text-center py-12 text-sm text-red-500">{error}</p>
        )}
        {!loading && !error && paged.length === 0 && (
          <p className="text-center py-12 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            조건에 맞는 팀원이 없습니다.
          </p>
        )}

        {!loading && !error && paged.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {paged.map((m, idx) => (
                <MemberCard
                  key={`${m.id}-${idx}`}
                  {...m}
                  onClickProfile={() => handleClickProfile(m)}
                />
              ))}
            </div>

            {/* ── 페이지네이션 ── */}
            <Pagination current={currentPage} totalPages={totalPages} onChange={setCurrentPage} className="mt-0 pb-0" />
          </>
        )}
      </div>

      {/* ── 프로필 모달 ── */}
      {selectedUser && (
        <MemberProfileModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
          fixedProjectId={projectId ? Number(projectId) : undefined}
          fixedProjectTitle={projectTitle}
        />
      )}
    </div>
  );
};

export default MemberRecommend;