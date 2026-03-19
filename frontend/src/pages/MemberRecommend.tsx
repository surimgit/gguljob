import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import RecommendCard from "../components/feature/team-recommend/RecommendCard";
import MemberCard from "../components/feature/team-recommend/MemberCard";
import MemberProfileModal from "../components/feature/team-recommend/MemberProfileModal";
import type { ProfileUser } from "../components/feature/mypage/ProfileModalLayout";
import beeImg from "../assets/images/memberfind.png";
import { getUsers } from "../api/user";
import type { UserSummary, PositionType, ExperienceLevel } from "../types/user";

/* ── 포지션 라벨 매핑 ── */
const POSITION_LABEL: Record<PositionType, string> = {
  FE: "Frontend",
  BE: "Backend",
  AI: "AI",
  PM: "PM",
  INFRA: "Infra",
  DESIGN: "Design",
};

/* ── 숙련도 라벨 매핑 ── */
const EXPERIENCE_LABEL: Record<ExperienceLevel, string> = {
  BEGINNER: "초급",
  JUNIOR: "초급",
  MID_LEVEL: "중급",
  SENIOR: "고급",
};

/* ── 필터 옵션 ── */
const POSITION_FILTERS: { label: string; value: PositionType | "전체" }[] = [
  { label: "전체", value: "전체" },
  { label: "Frontend", value: "FE" },
  { label: "Backend", value: "BE" },
  { label: "AI", value: "AI" },
  { label: "PM", value: "PM" },
  { label: "Infra", value: "INFRA" },
  { label: "Design", value: "DESIGN" },
];
const LEVEL_FILTERS = ["전체", "초급", "중급", "고급"];

const ITEMS_PER_PAGE = 6;

/** UserSummary → 카드 컴포넌트용 데이터로 변환 */
const toCardData = (u: UserSummary) => ({
  id: String(u.userId),
  name: u.userName,
  position: u.roles.length > 0 ? POSITION_LABEL[u.roles[0]] ?? u.roles[0] : "미정",
  level: u.experience ? (EXPERIENCE_LABEL[u.experience] ?? u.experience) : "-",
  matchRate: 0,
  introduction: u.description ?? "",
  techStacks: [] as string[],
  profileImage: u.profileImageUrl ?? "",
});

const MemberRecommend = () => {
  const [positionFilter, setPositionFilter] = useState<PositionType | "전체">("전체");
  const [levelFilter, setLevelFilter] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<ProfileUser | null>(null);

  const [members, setMembers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getUsers({ page: 0, size: 100 });
      setMembers(res.data.content ?? []);
    } catch {
      setError("사용자 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ── 필터 적용 ── */
  const filtered = members.filter((m) => {
    // 포지션 필터
    if (positionFilter !== "전체" && !m.roles.includes(positionFilter)) return false;

    // 숙련도 필터
    if (levelFilter !== "전체") {
      const label = m.experience ? EXPERIENCE_LABEL[m.experience] : null;
      if (label !== levelFilter) return false;
    }

    // 검색
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const nameMatch = m.userName.toLowerCase().includes(q);
      const roleMatch = m.roles.some(
        (r) => r.toLowerCase() === q || (POSITION_LABEL[r] ?? "").toLowerCase().includes(q)
      );
      return nameMatch || roleMatch;
    }

    return true;
  });

  // 상단 추천 3명 (전체 목록에서 첫 3명)
  const topRecommended = members.slice(0, 3).map(toCardData);

  // 하단 목록 페이지네이션
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered
    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    .map(toCardData);

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
                key={f.value}
                onClick={() => { setPositionFilter(f.value); setCurrentPage(1); }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                style={{
                  background: positionFilter === f.value ? "var(--color-primary-hover)" : "transparent",
                  color: positionFilter === f.value ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  border: "none",
                }}
              >
                {f.label}
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
        {topRecommended.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4 mb-10">
            {topRecommended.map((m, idx) => (
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
          </>
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
