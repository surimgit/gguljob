import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useParams, useSearchParams } from "react-router-dom";
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
import PersonalSpace, {
  type PersonalSubTab,
} from "../components/feature/project/PersonalSpace";
import { ChevronDown } from "lucide-react";
import chatbotImg from "../assets/images/chatbot.png";
import ChatbotPopup from "../components/common/ChatbotPopup";
import { useProjectStore } from "../stores/projectStore";
import api from "../api/index";
import type { PersonalSpaceData, MrRanking } from "../types/project";
import {
  getPersonalSpace,
  getTeamManagement,
  recommendTopics,
  updateProjectTopic,
} from "../api/projects";
import UserProfileModal from "../components/feature/mypage/UserProfileModal";
import { getCategoryColorPair } from "../constants/domains";
import { getRoleDisplayName, getRoleColor } from "../constants/skills";

/* ── 탭 설정 ── */
const TABS = [
  { key: "team", label: "팀 프로젝트", icon: FolderOpen },
  { key: "personal", label: "나만의 공간", icon: User },
  { key: "members", label: "팀원 관리", icon: Users },
  { key: "settings", label: "설정", icon: Settings },
] as const;

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
  const [searchParams] = useSearchParams();
  const activeTabFromUrl = searchParams.get("tab") || "team";
  const [activeTab, setActiveTab] = useState<string>(activeTabFromUrl);

  const prevTabRef = useRef(activeTabFromUrl);
  if (prevTabRef.current !== activeTabFromUrl) {
    prevTabRef.current = activeTabFromUrl;
    setActiveTab(activeTabFromUrl);
  }

  const [personalSubTab, setPersonalSubTab] =
    useState<PersonalSubTab>("troubleshooting");
  const [personalDropdownOpen, setPersonalDropdownOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [editingTopic, setEditingTopic] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [showAiRecommend, setShowAiRecommend] = useState(false);
  const [editingRepo, setEditingRepo] = useState(false);
  const [repoInput, setRepoInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [copied, setCopied] = useState(false);
  const storedSecret = id ? localStorage.getItem(`webhook_secret_${id}`) : null;
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const [payloadCopied, setPayloadCopied] = useState(false);
  const activeSecret = webhookSecret ?? storedSecret;
  const personalDropdownRef = useRef<HTMLDivElement>(null);

  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  const { dashboard, gitLog, dashboardLoading, fetchDashboard } =
    useProjectStore();
  const [personalData, setPersonalData] = useState<PersonalSpaceData | null>(
    null,
  );
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    if (id) fetchDashboard(Number(id));
  }, [id, fetchDashboard]);

  useEffect(() => {
    if (!id) return;
    getTeamManagement(Number(id))
      .then(() => setIsLeader(true))
      .catch(() => setIsLeader(false));
  }, [id]);


  useEffect(() => {
    if (id) {
      getPersonalSpace(Number(id))
        .then(({ data }) => setPersonalData(data as PersonalSpaceData))
        .catch((err) => console.error("personal-space 로드 실패:", err));
    }
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        personalDropdownRef.current &&
        !personalDropdownRef.current.contains(e.target as Node)
      ) {
        setPersonalDropdownOpen(false);
      }
    };
    if (personalDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [personalDropdownOpen]);

  // 챗봇 표시 조건: 팀 프로젝트 탭에서만
  const showChatbot = activeTab === "team";

  if (dashboardLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-background)" }}
      >
        <p style={{ color: "var(--color-text-tertiary)" }}>불러오는 중...</p>
      </div>
    );
  }

  const handleRecommend = (isRefresh: boolean) => {
    if (!id) return;
    setTopicsLoading(true);
    setSelectedTopic(null);
    recommendTopics(Number(id), isRefresh, keyword || undefined)
      .then(({ data }) => {
        setTopics(data.recommendedTopics ?? []);
      })
      .catch(() => toast.error("주제 추천에 실패했습니다. 다시 시도해주세요."))
      .finally(() => setTopicsLoading(false));
  };

  const projectInfo = dashboard?.projectInfo ?? {
    title: "",
    teamName: "",
    domain: "",
    description: "",
    skills: [],
  };
  const teamStats = dashboard?.teamStats ?? {
    totalMembers: 0,
    roleCounts: {},
    totalCommits: 0,
    totalTroubleshootings: 0,
  };
  const gitRepoInfo = dashboard?.gitRepoInfo ?? null;
  const rankings = gitLog?.mrRankings ?? [];
  const activities = gitLog?.recentActivities ?? [];
  const maxCommits = Math.max(1, ...rankings.map((m) => m.mrCount));

  const roleEntries = Object.entries(teamStats.roleCounts ?? {}).filter(
    ([, count]) => count > 0,
  );

  return (
    <>
      <div
        className="min-h-screen"
        style={{ background: "var(--color-background)" }}
      >
        <div className="mx-auto py-6 flex flex-col gap-8 max-w-[1400px] px-4 sm:px-6 lg:px-8">
          {/* ── 상단 탭 네비게이션 ── */}
          <div
            className="flex flex-wrap gap-1 rounded-2xl px-2 py-1.5 w-fit"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              const isPersonal = tab.key === "personal";

              if (isPersonal) {
                return (
                  <div
                    key={tab.key}
                    className="relative"
                    ref={personalDropdownRef}
                    onMouseLeave={() => setPersonalDropdownOpen(false)}
                  >
                    <button
                      onMouseEnter={() => setPersonalDropdownOpen(true)}
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
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          personalDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* 드롭다운 메뉴 */}
                    {personalDropdownOpen && (
                      <div className="absolute top-full left-0 pt-2 min-w-[140px] z-50">
                        <div
                          className="rounded-xl py-1 shadow-lg"
                          style={{
                            background: "var(--color-surface)",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          {[
                            {
                              key: "troubleshooting" as PersonalSubTab,
                              label: "트러블슈팅",
                            },
                            {
                              key: "mr-review" as PersonalSubTab,
                              label: "MR 리뷰",
                            },
                          ].map((item) => (
                            <button
                              key={item.key}
                              onClick={() => {
                                setActiveTab("personal");
                                setPersonalSubTab(item.key);
                                setPersonalDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                              style={{
                                color:
                                  activeTab === "personal" &&
                                  personalSubTab === item.key
                                    ? "var(--color-primary-hover)"
                                    : "var(--color-text-secondary)",
                                fontWeight:
                                  activeTab === "personal" &&
                                  personalSubTab === item.key
                                    ? 700
                                    : 500,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "var(--color-background)";
                                e.currentTarget.style.color =
                                  "var(--color-primary-hover)";
                                e.currentTarget.style.fontWeight = "700";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "";
                                const isSelected =
                                  activeTab === "personal" &&
                                  personalSubTab === item.key;
                                e.currentTarget.style.color = isSelected
                                  ? "var(--color-primary-hover)"
                                  : "var(--color-text-secondary)";
                                e.currentTarget.style.fontWeight = isSelected
                                  ? "700"
                                  : "500";
                              }}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setPersonalDropdownOpen(false);
                  }}
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
                  {tab.key === "members"
                    ? isLeader
                      ? "팀원 관리"
                      : "팀 정보"
                    : tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "members" && (
            <TeamMembers
              dashboard={dashboard}
              projectId={id ? Number(id) : undefined}
            />
          )}
          {activeTab === "settings" && (
            <ProjectSettings
              dashboard={dashboard}
              projectId={id ? Number(id) : undefined}
            />
          )}
          {activeTab === "personal" && (
            <PersonalSpace
              projectId={id ? Number(id) : undefined}
              projectTitle={projectInfo.title}
              personalData={personalData}
              subTab={personalSubTab}
            />
          )}

          {activeTab === "team" && (
            <>
              {/* ── 프로젝트 히어로 배너 ── */}
              <div
                className="rounded-2xl p-5 md:p-8 relative overflow-hidden backdrop-blur-xl"
                style={{
                  background: "rgba(255, 248, 230, 0.55)",
                  border: "1px solid rgba(255, 255, 255, 0.6)",
                  boxShadow:
                    "0 8px 32px rgba(0, 0, 0, 0.06), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 0 rgba(0, 0, 0, 0.05)",
                }}
              >
                <div className="flex items-stretch justify-between gap-8">
                  {/* 좌측 프로젝트 정보 */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-1">
                      <h1
                        className="text-3xl font-bold"
                        style={{ color: "var(--color-text-brown)" }}
                      >
                        {projectInfo.teamName || projectInfo.title}
                      </h1>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-sm font-semibold flex-shrink-0"
                        style={{
                          background: getCategoryColorPair(projectInfo.domain)
                            .bg,
                          color: getCategoryColorPair(projectInfo.domain).text,
                        }}
                      >
                        {projectInfo.domain || "미정"}
                      </span>
                      <span
                        className="flex items-center gap-1 text-sm font-semibold flex-shrink-0"
                        style={{ color: "var(--color-success)" }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "var(--color-success)" }}
                        />
                        진행중
                      </span>
                    </div>
                    <p
                      className="text-base leading-relaxed mb-5 max-w-lg mt-3"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {projectInfo.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(projectInfo.skills ?? []).map((stack) => (
                        <span
                          key={stack}
                          className="px-3 py-1 rounded-full text-xs font-medium border"
                          style={{
                            background: "var(--color-primary)",
                            color: "var(--color-text-primary)",
                            borderColor: "var(--color-primary-hover)",
                          }}
                        >
                          {stack}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 우측 스탯 */}
                  <div className="hidden md:flex items-stretch gap-10 flex-shrink-0">
                    <div className="flex flex-col items-center px-6 pt-4 pb-4">
                      <span
                        className="text-lg font-semibold"
                        style={{ color: "var(--color-text-brown)" }}
                      >
                        팀원
                      </span>
                      <div className="flex-1 flex flex-col items-center justify-center gap-1 mt-2">
                        {roleEntries.map(([role, count]) => (
                          <div key={role} className="flex items-center gap-2">
                            <span
                              className="text-xl font-bold"
                              style={{ color: getRoleColor(role) }}
                            >
                              {getRoleDisplayName(role)}
                            </span>
                            <span
                              className="text-xl font-bold"
                              style={{ color: getRoleColor(role) }}
                            >
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-center px-6 pt-4 pb-4">
                      <span
                        className="text-lg font-semibold"
                        style={{ color: "var(--color-text-brown)" }}
                      >
                        커밋
                      </span>
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <span
                          className="text-xl font-bold mt-2"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          total
                        </span>
                        <span
                          className="text-5xl font-extrabold"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {teamStats.totalCommits}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center px-6 pt-4 pb-4">
                      <span
                        className="text-lg font-medium"
                        style={{ color: "var(--color-text-brown)" }}
                      >
                        트러블슈팅
                      </span>
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <span
                          className="text-xl font-bold mt-2"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          total
                        </span>
                        <span
                          className="text-5xl font-extrabold"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {teamStats.totalTroubleshootings}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 메인 2열 레이아웃 ── */}
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 items-start">
                <div className="flex flex-col gap-5">
                  {/* Git 레포지토리 카드 */}
                  <div
                    className="rounded-2xl p-5 shadow-sm min-h-[140px]"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
                      <div className="flex items-center gap-2">
                        <GitBranch
                          className="w-5 h-5"
                          style={{ color: "var(--color-primary)" }}
                        />
                        <span
                          className="text-lg font-bold"
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
                              : {
                                  background: "var(--color-border)",
                                  color: "var(--color-text-tertiary)",
                                }
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
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--color-background)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "";
                          }}
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
                            onFocus={(e) =>
                              (e.currentTarget.style.borderColor =
                                "var(--color-primary)")
                            }
                            onBlur={(e) =>
                              (e.currentTarget.style.borderColor =
                                "var(--color-border)")
                            }
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="password"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            placeholder="GitHub Personal Access Token"
                            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ border: "1px solid var(--color-border)" }}
                            onFocus={(e) =>
                              (e.currentTarget.style.borderColor =
                                "var(--color-primary)")
                            }
                            onBlur={(e) =>
                              (e.currentTarget.style.borderColor =
                                "var(--color-border)")
                            }
                          />
                          <button
                            onClick={() => {
                              if (!id) return;
                              api
                                .put<{ webhookSecret: string }>(`/v1/projects/${id}/git-repo`, {
                                  repoUrl: repoInput,
                                  githubToken: tokenInput,
                                })
                                .then((res) => {
                                  setEditingRepo(false);
                                  setTokenInput("");
                                  const secret = res.data.webhookSecret;
                                  setWebhookSecret(secret);
                                  if (id) localStorage.setItem(`webhook_secret_${id}`, secret);
                                  setShowWebhookModal(true);
                                  fetchDashboard(Number(id));
                                })
                                .catch((err) => {
                                  const msg = err.response?.data?.message
                                    ?? err.response?.data?.errors?.[0]?.defaultMessage
                                    ?? "레포 저장에 실패했습니다.";
                                  toast.error(msg);
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
                            onClick={() => {
                              setEditingRepo(false);
                              setTokenInput("");
                            }}
                            className="px-3 py-2 rounded-lg text-sm font-medium"
                            style={{
                              border: "1px solid var(--color-border)",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}

                    <div
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 px-4 py-3 rounded-xl"
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
                              navigator.clipboard.writeText(
                                gitRepoInfo.repoUrl,
                              );
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                            style={{
                              border: "1px solid var(--color-border)",
                              color: copied
                                ? "#16A34A"
                                : "var(--color-text-secondary)",
                            }}
                          >
                            {copied ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {copied ? "복사됨" : "복사"}
                          </button>
                        )}
                        {activeSecret && (
                          <button
                            onClick={() => setShowWebhookModal(true)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                            style={{
                              border: "1px solid var(--color-border)",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            <Settings className="w-3 h-3" />
                            Webhook
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 프로젝트 주제 카드 */}
                  <div
                    className="rounded-2xl px-5 py-7 shadow-sm min-h-[140px] flex flex-col gap-6"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-2 text-lg font-bold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        🚀 프로젝트 주제
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingTopic(true);
                            setTopicInput(projectInfo.title);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-secondary)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--color-background)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "";
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                          수정
                        </button>
                        <button
                          onClick={() => {
                            setShowAiRecommend((prev) => !prev);
                            if (!showAiRecommend && topics.length === 0) {
                              handleRecommend(false);
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                          style={{ background: "#6366f1" }}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          생성
                        </button>
                      </div>
                    </div>

                    {/* 현재 주제 표시 / 수정 모드 */}
                    {editingTopic ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={topicInput}
                          onChange={(e) => setTopicInput(e.target.value)}
                          placeholder="프로젝트 주제를 입력하세요"
                          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                          style={{ border: "1px solid var(--color-border)" }}
                          onFocus={(e) =>
                            (e.currentTarget.style.borderColor = "var(--color-primary)")
                          }
                          onBlur={(e) =>
                            (e.currentTarget.style.borderColor = "var(--color-border)")
                          }
                        />
                        <button
                          onClick={() => {
                            if (!id || !topicInput.trim()) return;
                            updateProjectTopic(Number(id), topicInput.trim())
                              .then(() => {
                                fetchDashboard(Number(id));
                                setEditingTopic(false);
                              })
                              .catch(() => toast.error("주제 수정에 실패했습니다."));
                          }}
                          disabled={!topicInput.trim()}
                          className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                          style={{ background: "var(--color-primary-hover)" }}
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingTopic(false)}
                          className="px-3 py-2 rounded-lg text-sm font-medium"
                          style={{
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <p
                          className="text-base font-semibold"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {projectInfo.title || "주제가 아직 없습니다"}
                        </p>
                      </div>
                    )}

                    {/* AI 주제 추천 서브카드 (생성 버튼으로 토글) */}
                    {showAiRecommend && (
                      <div
                        className="rounded-2xl px-5 py-5 border border-[#c7d2fe] relative overflow-hidden"
                        style={{
                          background:
                            "linear-gradient(180deg, #f5f3ff 0%, #eef2ff 100%)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#6366f1]" />
                            <span
                              className="text-base font-bold"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              AI 주제 추천
                            </span>
                            <span
                              className="text-sm"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              팀에 맞는 주제를 추천해요
                            </span>
                          </div>
                          <button
                            onClick={() => handleRecommend(true)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#c7d2fe] bg-white"
                            style={{
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${topicsLoading ? "animate-spin" : ""}`}
                            />
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
                            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none bg-white"
                            style={{
                              border: "1px solid #c7d2fe",
                            }}
                            onFocus={(e) =>
                              (e.currentTarget.style.borderColor = "#6366f1")
                            }
                            onBlur={(e) =>
                              (e.currentTarget.style.borderColor = "#c7d2fe")
                            }
                          />
                          <button
                            onClick={() => handleRecommend(true)}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                            style={{ background: "#6366f1" }}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            추천
                          </button>
                        </div>

                        {/* 추천 주제 목록 */}
                        <div className="flex flex-col gap-2 mb-4">
                          {topicsLoading ? (
                            <div
                              className="flex items-center justify-center py-6 gap-2"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span className="text-sm">
                                AI가 주제를 추천하고 있어요...
                              </span>
                            </div>
                          ) : topics.length === 0 ? (
                            <p
                              className="text-sm text-center py-4"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              키워드를 입력하고 추천 버튼을 눌러보세요
                            </p>
                          ) : null}
                          {!topicsLoading &&
                            topics.map((topic, idx) => {
                              const isSelected = selectedTopic === idx;
                              return (
                                <button
                                  key={idx}
                                  onClick={() =>
                                    setSelectedTopic(isSelected ? null : idx)
                                  }
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm text-left"
                                  style={{
                                    border: `1px solid ${isSelected ? "#6366f1" : "#c7d2fe"}`,
                                    background: isSelected
                                      ? "#eef2ff"
                                      : "var(--color-background)",
                                    color: isSelected
                                      ? "#6366f1"
                                      : "var(--color-text-primary)",
                                  }}
                                >
                                  <span
                                    className="text-xs font-bold w-4"
                                    style={{
                                      color: isSelected
                                        ? "#6366f1"
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
                          onClick={() => {
                            if (selectedTopic === null || !id) return;
                            updateProjectTopic(Number(id), topics[selectedTopic])
                              .then(() => {
                                fetchDashboard(Number(id));
                                setSelectedTopic(null);
                              })
                              .catch((err) => {
                                console.error(
                                  "주제 적용 실패:",
                                  err.response?.status,
                                  err.response?.data,
                                );
                                alert(
                                  "주제 적용에 실패했습니다. 다시 시도해주세요.",
                                );
                              });
                          }}
                        >
                          선택한 주제 적용하기
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  {/* MR 랭킹 카드 */}
                  <div
                    className="rounded-2xl p-5 shadow-sm min-h-[140px]"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div className="flex items-center gap-2 text-lg font-bold mb-4">
                      <BarChart2
                        className="w-5 h-5"
                        style={{ color: "var(--color-primary)" }}
                      />
                      <span style={{ color: "var(--color-text-primary)" }}>
                        MR 랭킹
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {rankings.length === 0 && (
                        <p
                          className="text-sm text-center py-4"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          아직 MR 기록이 없습니다
                        </p>
                      )}
                      {rankings.map((member: MrRanking, idx: number) => (
                        <div
                          key={member.userId}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setProfileUserId(member.userId);
                            }
                          }}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-[var(--color-primary-soft)] transition-colors"
                          style={
                            idx === 0
                              ? { background: "var(--color-primary-soft)" }
                              : {}
                          }
                          onClick={() => setProfileUserId(member.userId)}
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
                              background:
                                AVATAR_COLORS[idx % AVATAR_COLORS.length],
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
                    className="rounded-2xl p-5 shadow-sm min-h-[140px]"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div className="flex items-center gap-2 text-lg font-bold mb-4">
                      <Zap
                        className="w-5 h-5"
                        style={{ color: "var(--color-primary)" }}
                      />
                      <span style={{ color: "var(--color-text-primary)" }}>
                        최근 활동
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {activities.length === 0 && (
                        <p
                          className="text-sm text-center py-4"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          아직 활동 기록이 없습니다
                        </p>
                      )}
                      {activities.map((activity: any, idx: number) => (
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
                                background:
                                  AVATAR_COLORS[idx % AVATAR_COLORS.length],
                              }}
                            >
                              {activity.userName.charAt(0)}
                            </div>
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{
                                background: "var(--color-primary-soft)",
                              }}
                            >
                              <GitCommit
                                className="w-4 h-4"
                                style={{ color: "var(--color-primary-hover)" }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                            {activity.userName && (
                              <p
                                className="text-sm font-bold"
                                style={{ color: "var(--color-text-secondary)" }}
                              >
                                {activity.userName}
                              </p>
                            )}
                            <p
                              className="text-xs font-medium line-clamp-2"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {activity.content}
                            </p>
                            {activity.label && (
                              <p
                                className="text-xs font-mono font-semibold"
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

          {/* 챗봇 캐릭터 버튼 + 팝업 */}
          {showChatbot && (
            <>
              <button
                onClick={() => setChatbotOpen((prev) => !prev)}
                className="fixed bottom-8 right-8 w-40 h-40 hover:scale-110 z-40 overflow-hidden border-0 bg-transparent animate-float"
              >
                <img
                  src={chatbotImg}
                  alt="AI 챗봇"
                  className="w-full h-full object-cover"
                />
              </button>

              <ChatbotPopup
                isOpen={chatbotOpen}
                onClose={() => setChatbotOpen(false)}
                mode="agent"
              />
            </>
          )}
        </div>
      </div>

      {profileUserId !== null && (
        <UserProfileModal
          isOpen={true}
          onClose={() => setProfileUserId(null)}
          userId={profileUserId}
        />
      )}

      {/* Webhook 설정 안내 모달 */}
      {showWebhookModal && activeSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto"
            style={{ background: "var(--color-surface)" }}
          >
            <h3
              className="text-lg font-bold mb-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              GitHub Webhook 설정 안내
            </h3>
            <p
              className="text-sm mb-5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              아래 정보를 GitHub Webhook 설정 페이지에 입력하세요.
            </p>

            <div className="flex flex-col gap-3 mb-5">
              {/* Payload URL */}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                  Payload URL
                </label>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "var(--color-background)", border: "1px solid var(--color-border)" }}
                >
                  <code className="flex-1 text-sm font-mono break-all" style={{ color: "var(--color-text-primary)" }}>
                    https://j14e107.p.ssafy.io:8443/api/v1/github/webhook
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("https://j14e107.p.ssafy.io:8443/api/v1/github/webhook");
                      setPayloadCopied(true);
                      setTimeout(() => setPayloadCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium flex-shrink-0 transition-colors"
                    style={{ border: "1px solid var(--color-border)", color: payloadCopied ? "#16A34A" : "var(--color-text-secondary)" }}
                  >
                    {payloadCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {payloadCopied ? "복사됨" : "복사"}
                  </button>
                </div>
              </div>

              {/* Content type */}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                  Content type
                </label>
                <div
                  className="px-3 py-2 rounded-lg"
                  style={{ background: "var(--color-background)", border: "1px solid var(--color-border)" }}
                >
                  <code className="text-sm font-mono" style={{ color: "var(--color-text-primary)" }}>
                    application/json
                  </code>
                </div>
              </div>

              {/* Secret */}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                  Secret
                </label>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "var(--color-background)", border: "1px solid var(--color-border)" }}
                >
                  <code className="flex-1 text-sm font-mono break-all" style={{ color: "var(--color-text-primary)" }}>
                    {activeSecret}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeSecret!);
                      setSecretCopied(true);
                      setTimeout(() => setSecretCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium flex-shrink-0 transition-colors"
                    style={{ border: "1px solid var(--color-border)", color: secretCopied ? "#16A34A" : "var(--color-text-secondary)" }}
                  >
                    {secretCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {secretCopied ? "복사됨" : "복사"}
                  </button>
                </div>
              </div>

              {/* Events 안내 */}
              <div>
                <label className="text-xs font-bold mb-0.5 block" style={{ color: "var(--color-text-primary)" }}>
                  Which events would you like to trigger this webhook?
                </label>
                <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  <span className="font-semibold">Let me select individual events.</span> 를 선택한 뒤 아래 항목을 체크하세요.
                </p>
                <div
                  className="flex flex-wrap gap-1.5 px-3 py-2.5 rounded-lg"
                  style={{ background: "var(--color-background)", border: "1px solid var(--color-border)" }}
                >
                  {["Pull requests", "Issue comments", "Pushes"].map((event) => (
                    <span
                      key={event}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "var(--color-primary)", color: "var(--color-text-primary)" }}
                    >
                      {event}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Webhook 설정 페이지 이동 버튼 */}
            {(() => {
              const repoUrl = gitRepoInfo?.repoUrl ?? repoInput;
              const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
              const webhookSettingsUrl = match
                ? `https://github.com/${match[1]}/settings/hooks/new`
                : null;
              return webhookSettingsUrl ? (
                <a
                  href={webhookSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white mb-3 transition-colors"
                  style={{ background: "#24292e" }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  GitHub Webhook 설정 페이지로 이동
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null;
            })()}

            <button
              onClick={() => {
                setShowWebhookModal(false);
                setSecretCopied(false);
                setPayloadCopied(false);
              }}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectDashboard;
