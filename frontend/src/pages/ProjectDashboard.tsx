import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
  Pencil,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import ProjectSettings from "../components/feature/project/ProjectSettings";
import TeamMembers from "../components/feature/detail/tabs/TeamMembers";
import { useProjectStore } from "../stores/projectStore";
import api from "../api/index";

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
    className="relative"
    style={{
      width: large ? 128 : 112,
      height: large ? 144 : 128,
      filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
    }}
  >
    <div
      className="bg-white flex flex-col items-center justify-center w-full h-full"
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
  </div>
);

const AVATAR_COLORS = [
  "var(--color-primary)",
  "var(--color-success)",
  "#EC4899",
  "#7C3AED",
  "var(--color-blue)",
];

const formatTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
};

/* ── 메인 페이지 ── */
const ProjectDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("team");
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [editingRepo, setEditingRepo] = useState(false);
  const [repoInput, setRepoInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [copied, setCopied] = useState(false);

  const { dashboard, gitLog, dashboardLoading, fetchDashboard } =
    useProjectStore();

  useEffect(() => {
    if (id) fetchDashboard(Number(id));
  }, [id, fetchDashboard]);

  if (dashboardLoading || !dashboard) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-background)" }}
      >
        <p style={{ color: "var(--color-text-tertiary)" }}>
          {dashboardLoading ? "불러오는 중..." : "프로젝트를 찾을 수 없습니다."}
        </p>
      </div>
    );
  }

  const { projectInfo, teamStats, gitRepoInfo } = dashboard;
  const rankings = gitLog?.mrRankings ?? [];
  const activities = gitLog?.recentActivities ?? [];
  const maxCommits = Math.max(1, ...rankings.map((m) => m.mrCount));

  const feCount = teamStats.roleCounts?.["FRONTEND"] ?? teamStats.roleCounts?.["FE"] ?? 0;
  const beCount = teamStats.roleCounts?.["BACKEND"] ?? teamStats.roleCounts?.["BE"] ?? 0;

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
                        color: "var(--color-text-primary)",
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

        {activeTab === "members" && <TeamMembers dashboard={dashboard} />}
        {activeTab === "settings" && <ProjectSettings dashboard={dashboard} />}

        {activeTab === "team" && (
        <>
        {/* ── 프로젝트 히어로 배너 ── */}
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-soft) 100%)",
          }}
        >
          <div className="flex items-start justify-between gap-8">
            {/* 좌측 프로젝트 정보 */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "rgba(0,0,0,0.1)", color: "var(--color-text-primary)" }}
                >
                  {projectInfo.domain || "미정"}
                </span>
                <span
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--color-success)" }}
                  />
                  진행중
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {projectInfo.teamName}
                </span>
              </div>
              <h1
                className="text-3xl font-bold mb-3"
                style={{ color: "var(--color-text-primary)" }}
              >
                {projectInfo.title}
              </h1>
              <p
                className="text-sm leading-relaxed mb-5 max-w-lg"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {projectInfo.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {(projectInfo.skills ?? []).map((stack) => (
                  <span
                    key={stack}
                    className="px-3 py-1 rounded-full text-xs font-medium border"
                    style={{
                      background: "rgba(0,0,0,0.08)",
                      color: "var(--color-text-primary)",
                      borderColor: "rgba(0,0,0,0.15)",
                    }}
                  >
                    {stack}
                  </span>
                ))}
              </div>
            </div>

            {/* 우측 헥사곤 스탯 */}
            <div className="flex flex-col items-center flex-shrink-0">
              <HexStat label="팀원" value={teamStats.totalMembers} large>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span style={{ color: "var(--color-blue)" }}>
                    FE {feCount}
                  </span>
                  <span style={{ color: "var(--color-success)" }}>
                    BE {beCount}
                  </span>
                </div>
              </HexStat>
              <div className="flex gap-4" style={{ marginTop: -20 }}>
                <HexStat
                  label="커밋"
                  value={teamStats.totalCommits}
                  subLabel="total"
                />
                <HexStat
                  label="트러블슈팅"
                  value={teamStats.totalTroubleshootings}
                  subLabel="total"
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
                    className="w-5 h-5"
                    style={{ color: "var(--color-primary)" }}
                  />
                  <span
                    className="text-base font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Git 레포지토리
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    style={
                      gitRepoInfo?.repoUrl
                        ? { background: "#DCFCE7", color: "#16A34A" }
                        : { background: "var(--color-border)", color: "var(--color-text-tertiary)" }
                    }
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: gitRepoInfo?.repoUrl
                          ? "#16A34A"
                          : "var(--color-text-tertiary)",
                      }}
                    />
                    {gitRepoInfo?.repoUrl ? "연동됨" : "미연동"}
                  </span>
                  <button
                    onClick={() => {
                      setEditingRepo(true);
                      setRepoInput(gitRepoInfo?.repoUrl ?? "");
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-secondary)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-background)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}
                  >
                    <Pencil className="w-3 h-3" />
                    수정
                  </button>
                </div>
              </div>

              {/* 수정 모드 */}
              {editingRepo && (
                <div className="flex flex-col gap-2 mb-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      placeholder="https://github.com/owner/repo"
                      className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: "1px solid var(--color-border)" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="GitHub Personal Access Token"
                      className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: "1px solid var(--color-border)" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                    />
                    <button
                      onClick={() => {
                        if (!id) return;
                        api.put(`/v1/projects/${id}/git-repo`, { repoUrl: repoInput, githubToken: tokenInput })
                          .then(() => {
                            setEditingRepo(false);
                            setTokenInput("");
                            fetchDashboard(Number(id));
                          })
                          .catch((err) => {
                            console.error("레포 저장 실패:", err);
                          });
                      }}
                      disabled={!repoInput || !tokenInput}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "var(--color-primary-hover)" }}
                    >
                      저장
                    </button>
                    <button
                      onClick={() => { setEditingRepo(false); setTokenInput(""); }}
                      className="px-3 py-2 rounded-lg text-sm font-medium"
                      style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{
                  border: "1px solid var(--color-border)",
                  background: "var(--color-background)",
                }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: "var(--color-text-secondary)" }}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  {gitRepoInfo?.repoUrl ? (
                    <a
                      href={gitRepoInfo.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold truncate hover:underline flex items-center gap-1"
                      style={{ color: "var(--color-blue)" }}
                    >
                      {gitRepoInfo.repoUrl}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <span
                      className="text-sm font-bold"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      연동된 레포 없음
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {gitRepoInfo?.repoUrl && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(gitRepoInfo.repoUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                      style={{
                        border: "1px solid var(--color-border)",
                        color: copied ? "#16A34A" : "var(--color-text-secondary)",
                      }}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "복사됨" : "복사"}
                    </button>
                  )}
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {gitRepoInfo?.lastSyncTime ? `${formatTime(gitRepoInfo.lastSyncTime)} 동기화` : ""}
                  </span>
                </div>
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
                  {projectInfo.title}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {projectInfo.description}
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
                  className="w-5 h-5"
                  style={{ color: "var(--color-primary)" }}
                />
                <span style={{ color: "var(--color-text-primary)" }}>
                  MR 랭킹
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {rankings.map((member, idx) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={
                      idx === 0
                        ? { background: "var(--color-primary-soft)" }
                        : {}
                    }
                  >
                    <span
                      className="text-sm font-black w-5 text-center"
                      style={{
                        color:
                          idx === 0
                            ? "var(--color-primary-hover)"
                            : "var(--color-text-tertiary)",
                      }}
                    >
                      {member.rank}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{
                        background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                      }}
                    >
                      {member.userName?.charAt(0) ?? "?"}
                    </div>
                    <span
                      className="text-sm font-semibold flex-1"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {member.userName}
                    </span>
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{ background: "var(--color-border)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(member.mrCount / maxCommits) * 100}%`,
                          background:
                            idx === 0
                              ? "var(--color-primary)"
                              : "var(--color-text-tertiary)",
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-black w-8 text-right"
                      style={{
                        color:
                          idx === 0
                            ? "var(--color-primary-hover)"
                            : "var(--color-text-secondary)",
                      }}
                    >
                      {member.mrCount}
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
                  className="w-5 h-5"
                  style={{ color: "var(--color-primary)" }}
                />
                <span style={{ color: "var(--color-text-primary)" }}>
                  최근 활동
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {activities.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 px-2 py-2.5 rounded-lg"
                    style={
                      idx % 2 === 0
                        ? { background: "var(--color-background)" }
                        : {}
                    }
                  >
                    {activity.userName ? (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{
                          background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                        }}
                      >
                        {activity.userName.charAt(0)}
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
                      {activity.userName && (
                        <p
                          className="text-xs font-bold mb-0.5"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {activity.userName}
                        </p>
                      )}
                      <p
                        className="text-sm font-medium line-clamp-2"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {activity.content}
                      </p>
                      {activity.label && (
                        <p
                          className="text-xs font-mono mt-0.5 font-semibold"
                          style={{ color: "var(--color-blue)" }}
                        >
                          {activity.label}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-xs flex-shrink-0 font-medium"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {formatTime(activity.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;
