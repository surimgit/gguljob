import { useState } from "react";
import {
  FolderOpen,
  User,
  Users,
  Settings,
  GitBranch,
  BarChart2,
  Zap,
  Sparkles,
  RefreshCw,
  GitCommit,
} from "lucide-react";

/* ── 타입 ── */
interface TeamMember {
  name: string;
  avatarColor?: string;
  commits: number;
}

interface RecentActivity {
  type: "commit" | "system";
  author?: string;
  avatarColor?: string;
  message: string;
  branch?: string;
  time: string;
}

interface ProjectData {
  id: string;
  domain: string;
  status: "active" | "done";
  recruitStatus: string;
  title: string;
  description: string;
  techStacks: string[];
  memberCount: number;
  fe: number;
  be: number;
  totalCommits: number;
  troubleshootingCount: number;
  troubleshootingResolved: number;
  repoUrl: string;
  lastSyncAt: string;
  currentTopic: { title: string; description: string };
  mrRanking: TeamMember[];
  recentActivities: RecentActivity[];
}

/* ── 목업 데이터 ── */
const MOCK_PROJECT: ProjectData = {
  id: "1",
  domain: "개발도구",
  status: "active",
  recruitStatus: "모집중 D-12",
  title: "꿀잡 - AI 기반 구직 매칭 플랫폼",
  description:
    "GitHub 분석과 AI 매칭을 통해 개발자에게 최적의 프로젝트 팀을 추천하는 서비스입니다. 기술 스택, 협업 성향, 경험치를 종합 분석합니다.",
  techStacks: ["React", "TypeScript", "Spring Boot", "PostgreSQL", "Redis"],
  memberCount: 6,
  fe: 3,
  be: 3,
  totalCommits: 247,
  troubleshootingCount: 18,
  troubleshootingResolved: 14,
  repoUrl: "github.com/ssafy/gguljob",
  lastSyncAt: "5분 전",
  currentTopic: {
    title: "프로젝트 대시보드 UI 개선",
    description:
      "팀 프로젝트 탭의 대시보드 레이아웃을 개선하고, Git 연동 상태 표시 및 MR 랭킹 시스템을 구현합니다.",
  },
  mrRanking: [
    { name: "김도현", avatarColor: "var(--color-primary)", commits: 52 },
    { name: "이서준", avatarColor: "var(--color-success)", commits: 41 },
    { name: "박지민", avatarColor: "#EC4899", commits: 38 },
    { name: "정하은", avatarColor: "#7C3AED", commits: 29 },
    { name: "최민수", avatarColor: "var(--color-blue)", commits: 22 },
  ],
  recentActivities: [
    {
      type: "commit",
      author: "김도현",
      avatarColor: "var(--color-primary)",
      message: "feat: 프로젝트 대시보드 히어로 배너 구현",
      branch: "fe/feature-dashboard",
      time: "2시간 전",
    },
    {
      type: "commit",
      author: "이서준",
      avatarColor: "var(--color-success)",
      message: "fix: JWT 토큰 갱신 로직 수정",
      branch: "be/fix-auth",
      time: "3시간 전",
    },
    {
      type: "system",
      message: "GitHub 레포지토리가 동기화되었습니다",
      time: "5시간 전",
    },
    {
      type: "commit",
      author: "박지민",
      avatarColor: "#EC4899",
      message: "refactor: API 응답 타입 통일 및 에러 핸들링 개선",
      branch: "be/refactor-api",
      time: "어제",
    },
  ],
};

const AI_TOPICS = [
  "GitHub Actions CI/CD 파이프라인 구축",
  "WebSocket 기반 실시간 알림 시스템",
  "Redis 캐싱 전략 최적화",
];

/* ── 탭 설정 ── */
const TABS = [
  { key: "team", label: "팀 프로젝트", icon: FolderOpen },
  { key: "personal", label: "나만의 공간", icon: User },
  { key: "members", label: "팀원 관리", icon: Users },
  { key: "settings", label: "설정", icon: Settings },
] as const;

/* ── 헥사곤 컴포넌트 ── */
const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

const HexStat = ({
  label,
  value,
  subLabel,
  large,
  children,
}: {
  label: string;
  value: string | number;
  subLabel?: string;
  large?: boolean;
  children?: React.ReactNode;
}) => (
  <div
    className={`bg-white flex flex-col items-center justify-center ${
      large ? "w-32 h-36" : "w-28 h-32"
    }`}
    style={{ clipPath: HEX_CLIP }}
  >
    <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
      {label}
    </span>
    <span
      className={`font-black ${large ? "text-4xl" : "text-2xl"}`}
      style={{ color: "var(--color-text-primary)" }}
    >
      {value}
    </span>
    {children}
    {subLabel && (
      <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
        {subLabel}
      </span>
    )}
  </div>
);

/* ── 메인 페이지 ── */
const ProjectDashboard = () => {
  const [activeTab, setActiveTab] = useState<string>("team");
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const project = MOCK_PROJECT;

  const maxCommits = Math.max(...project.mrRanking.map((m) => m.commits));

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-background)" }}
    >
      <div className="max-w-5xl mx-auto px-8 py-6 flex flex-col gap-5">
        {/* ── 상단 탭 네비게이션 ── */}
        <div
          className="flex gap-1 rounded-2xl px-2 py-1.5 w-fit"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm cursor-pointer transition-colors ${
                  isActive ? "font-bold" : "font-medium"
                }`}
                style={
                  isActive
                    ? {
                        background: "var(--color-primary)",
                        color: "var(--color-surface)",
                      }
                    : { color: "var(--color-text-secondary)" }
                }
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background =
                      "var(--color-background)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "";
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── 프로젝트 히어로 배너 ── */}
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)",
          }}
        >
          <div className="flex items-start justify-between gap-8">
            {/* 좌측 프로젝트 정보 */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                  {project.domain}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-white">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--color-success)" }}
                  />
                  {project.status === "active" ? "진행중" : "완료"}
                </span>
                <span className="text-xs text-white/70">
                  {project.recruitStatus}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                {project.title}
              </h1>
              <p className="text-sm text-white/80 leading-relaxed mb-5 max-w-lg">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.techStacks.map((stack) => (
                  <span
                    key={stack}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30"
                  >
                    {stack}
                  </span>
                ))}
              </div>
            </div>

            {/* 우측 헥사곤 스탯 */}
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              <HexStat label="팀원" value={project.memberCount} large>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span style={{ color: "var(--color-blue)" }}>
                    FE {project.fe}
                  </span>
                  <span style={{ color: "var(--color-success)" }}>
                    BE {project.be}
                  </span>
                </div>
              </HexStat>
              <div className="flex gap-2">
                <HexStat
                  label="커밋"
                  value={project.totalCommits}
                  subLabel="total"
                />
                <HexStat
                  label="트러블슈팅"
                  value={project.troubleshootingCount}
                  subLabel={`해결 ${project.troubleshootingResolved}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 메인 2열 레이아웃 ── */}
        <div className="grid grid-cols-[1fr_320px] gap-5">
          {/* ── 좌측 컬럼 ── */}
          <div className="flex flex-col gap-5">
            {/* Git 레포지토리 카드 */}
            <div
              className="rounded-2xl p-5 shadow-sm"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GitBranch
                    className="w-4 h-4"
                    style={{ color: "var(--color-primary)" }}
                  />
                  <span
                    className="text-base font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Git 레포지토리
                  </span>
                </div>
                <span
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "#DCFCE7", color: "var(--color-success)" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--color-success)" }}
                  />
                  연동됨
                </span>
              </div>
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{
                  border: "1px solid var(--color-border)",
                  background: "var(--color-background)",
                }}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5"
                    style={{ color: "var(--color-text-secondary)" }}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {project.repoUrl}
                  </span>
                </div>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {project.lastSyncAt} 동기화
                </span>
              </div>
            </div>

            {/* 프로젝트 주제 카드 */}
            <div
              className="rounded-2xl p-5 shadow-sm"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                className="flex items-center gap-2 text-base font-bold mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                🚀 프로젝트 주제
              </div>

              {/* 현재 주제 */}
              <div className="mb-4">
                <p
                  className="text-base font-bold mb-1"
                  style={{ color: "var(--color-primary-hover)" }}
                >
                  {project.currentTopic.title}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {project.currentTopic.description}
                </p>
              </div>

              {/* AI 주제 추천 서브카드 */}
              <div
                className="rounded-xl p-4"
                style={{ border: "1px solid var(--color-border)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "#EDE9FE" }}
                    >
                      <Sparkles className="w-3.5 h-3.5" style={{ color: "#7C3AED" }} />
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      AI 주제 추천
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      팀에 맞는 주제를 추천해요
                    </span>
                  </div>
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    <RefreshCw className="w-3 h-3" />
                    새로 추천
                  </button>
                </div>

                {/* 키워드 입력 */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="키워드를 입력하세요 (예: 인증, 배포)"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      border: "1px solid var(--color-border)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "var(--color-primary)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "var(--color-border)")
                    }
                  />
                  <button
                    className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ background: "#7C3AED" }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    생성
                  </button>
                </div>

                {/* 추천 주제 목록 */}
                <div className="flex flex-col gap-2 mb-4">
                  {AI_TOPICS.map((topic, idx) => {
                    const isSelected = selectedTopic === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() =>
                          setSelectedTopic(isSelected ? null : idx)
                        }
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm text-left"
                        style={{
                          border: `1px solid ${isSelected ? "#7C3AED" : "var(--color-border)"}`,
                          background: isSelected
                            ? "#EDE9FE"
                            : "var(--color-background)",
                          color: isSelected
                            ? "#7C3AED"
                            : "var(--color-text-primary)",
                        }}
                      >
                        <span
                          className="text-xs font-bold w-4"
                          style={{
                            color: isSelected
                              ? "#7C3AED"
                              : "var(--color-text-tertiary)",
                          }}
                        >
                          {idx + 1}
                        </span>
                        {topic}
                      </button>
                    );
                  })}
                </div>

                {/* 적용 버튼 */}
                <button
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
                  style={
                    selectedTopic !== null
                      ? { background: "#7C3AED" }
                      : {
                          background: "var(--color-border)",
                          color: "var(--color-text-tertiary)",
                          cursor: "not-allowed",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (selectedTopic !== null)
                      e.currentTarget.style.background = "#6D28D9";
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTopic !== null)
                      e.currentTarget.style.background = "#7C3AED";
                  }}
                  disabled={selectedTopic === null}
                >
                  선택한 주제 적용하기
                </button>
              </div>
            </div>
          </div>

          {/* ── 우측 컬럼 ── */}
          <div className="flex flex-col gap-5">
            {/* MR 랭킹 카드 */}
            <div
              className="rounded-2xl p-5 shadow-sm"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-center gap-2 text-base font-bold mb-4">
                <BarChart2
                  className="w-4 h-4"
                  style={{ color: "var(--color-primary)" }}
                />
                <span style={{ color: "var(--color-text-primary)" }}>
                  MR 랭킹
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {project.mrRanking.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span
                      className="text-sm font-bold w-4"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {idx + 1}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{
                        background: member.avatarColor || "var(--color-primary)",
                      }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <span
                      className="text-sm font-medium flex-1"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {member.name}
                    </span>
                    <div
                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--color-border)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(member.commits / maxCommits) * 100}%`,
                          background:
                            idx === 0
                              ? "var(--color-primary)"
                              : "var(--color-text-tertiary)",
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-bold w-8 text-right"
                      style={{
                        color:
                          idx === 0
                            ? "var(--color-primary-hover)"
                            : "var(--color-text-secondary)",
                      }}
                    >
                      {member.commits}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 최근 활동 카드 */}
            <div
              className="rounded-2xl p-5 shadow-sm"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-center gap-2 text-base font-bold mb-4">
                <Zap
                  className="w-4 h-4"
                  style={{ color: "var(--color-primary)" }}
                />
                <span style={{ color: "var(--color-text-primary)" }}>
                  최근 활동
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {project.recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {activity.type === "commit" ? (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{
                          background:
                            activity.avatarColor || "var(--color-primary)",
                        }}
                      >
                        {activity.author?.charAt(0)}
                      </div>
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--color-primary-soft)" }}
                      >
                        <GitCommit
                          className="w-4 h-4"
                          style={{ color: "var(--color-primary-hover)" }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm line-clamp-2"
                        style={{
                          color:
                            activity.type === "commit"
                              ? "var(--color-text-primary)"
                              : "var(--color-text-secondary)",
                        }}
                      >
                        {activity.message}
                      </p>
                      {activity.branch && (
                        <p
                          className="text-xs font-mono mt-0.5"
                          style={{ color: "var(--color-blue)" }}
                        >
                          {activity.branch}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-xs flex-shrink-0"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
