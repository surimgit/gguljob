import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import type { ProjectSimple, BackendProjectStatus } from "../types/project";

/* ── 상수 ── */

const AVATAR_COLORS = [
  "var(--color-primary)",
  "var(--color-blue)",
  "var(--color-success-dark)",
  "#EC4899",
];

/* ── 컴포넌트 ── */

const ProjectCard = ({ project }: { project: ProjectSimple }) => {
  const navigate = useNavigate();
  const isActive = project.status !== "DONE";
  const avatarColor = AVATAR_COLORS[project.projectId % AVATAR_COLORS.length];

  const feCount = project.roleCounts?.["FRONTEND"] ?? project.roleCounts?.["FE"] ?? 0;
  const beCount = project.roleCounts?.["BACKEND"] ?? project.roleCounts?.["BE"] ?? 0;

  return (
    <div
      className="rounded-2xl p-5 shadow-sm flex flex-col gap-3 border cursor-pointer hover:shadow-md transition-shadow"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
      onClick={() => navigate(`/my-projects/${project.projectId}`)}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-bold"
          style={{ color: "var(--color-amber)" }}
        >
          {project.domain || "미정"}
        </span>
        <span
          className="flex items-center gap-1 text-xs font-medium"
          style={{
            color: isActive
              ? "var(--color-success-dark)"
              : "var(--color-text-tertiary)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: isActive
                ? "var(--color-success-dark)"
                : "var(--color-text-tertiary)",
            }}
          />
          {project.status === "RECRUITING"
            ? "모집중"
            : project.status === "PROCEEDING"
              ? "진행중"
              : "완료"}
        </span>
      </div>

      {/* 본문 */}
      <div>
        <h3
          className="text-lg font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {project.title}
        </h3>
        {project.teamName && (
          <p
            className="text-sm leading-relaxed mt-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {project.teamName}
          </p>
        )}
      </div>

      {/* 기술 스택 */}
      {project.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.skills.map((stack) => (
            <span
              key={stack}
              className="px-3 py-1 rounded-full border text-xs font-medium"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
                backgroundColor: "var(--color-background)",
              }}
            >
              {stack}
            </span>
          ))}
        </div>
      )}

      {/* 하단 */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-2 text-xs font-bold">
          <span style={{ color: "var(--color-blue)" }}>FE {feCount}</span>
          <span style={{ color: "var(--color-success)" }}>BE {beCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: avatarColor }}
          >
            {project.leaderName?.[0] ?? "?"}
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {project.leaderName}
          </span>
        </div>
      </div>

      {/* 완료일 */}
      {project.finishedAt && (
        <p
          className="text-xs"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          완료: {new Date(project.finishedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

type TabStatus = "active" | "done";

const MyProjects = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabStatus>("active");

  const { myProjects, myProjectsLoading, fetchMyProjects } = useProjectStore();

  useEffect(() => {
    fetchMyProjects();
  }, [fetchMyProjects]);

  const filterByTab = (status: BackendProjectStatus) =>
    tab === "active"
      ? status === "RECRUITING" || status === "PROCEEDING"
      : status === "DONE";

  const currentProjects = myProjects.filter((p) => filterByTab(p.status));
  const activeCount = myProjects.filter(
    (p) => p.status === "RECRUITING" || p.status === "PROCEEDING"
  ).length;
  const doneCount = myProjects.filter((p) => p.status === "DONE").length;

  return (
    <div
      style={{ backgroundColor: "var(--color-background)" }}
      className="min-h-screen"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-10">
        {/* 헤더 */}
        <h1
          className="text-2xl sm:text-3xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          내 프로젝트
        </h1>
        <p
          className="text-xs sm:text-sm mt-1"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          참여 중인 프로젝트와 완료한 프로젝트를 관리하세요
        </p>

        {/* 탭 */}
        <div className="flex gap-2 mt-6 mb-4">
          {([
            { key: "active" as TabStatus, label: "진행중", count: activeCount },
            { key: "done" as TabStatus, label: "완료", count: doneCount },
          ]).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors"
              style={{
                backgroundColor:
                  tab === t.key
                    ? "var(--color-primary)"
                    : "var(--color-surface)",
                color:
                  tab === t.key
                    ? "var(--color-text-primary)"
                    : "var(--color-text-secondary)",
                border:
                  tab === t.key
                    ? "none"
                    : "1px solid var(--color-border)",
              }}
            >
              {t.label}
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{
                  backgroundColor:
                    tab === t.key
                      ? "rgba(0,0,0,0.15)"
                      : "var(--color-border)",
                  color:
                    tab === t.key
                      ? "var(--color-text-primary)"
                      : "var(--color-text-tertiary)",
                }}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* 카운트 */}
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          총 {currentProjects.length}개 프로젝트
        </p>

        {/* 로딩 */}
        {myProjectsLoading && (
          <p
            className="text-sm py-12 text-center"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            불러오는 중...
          </p>
        )}

        {/* 카드 그리드 */}
        {!myProjectsLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {currentProjects.map((project) => (
              <ProjectCard key={project.projectId} project={project} />
            ))}

            {/* 새 프로젝트 만들기 (진행중 탭) */}
            {tab === "active" && (
              <button
                type="button"
                onClick={() => navigate("/projects/new")}
                className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[280px] transition-colors group"
                style={{ borderColor: "var(--color-border)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "var(--color-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "var(--color-border)")
                }
              >
                <span
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "var(--color-border)" }}
                >
                  <Plus
                    className="w-6 h-6"
                    style={{ color: "var(--color-text-tertiary)" }}
                  />
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  새 프로젝트 만들기
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  팀원을 모집하고 프로젝트를 시작하세요
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProjects;
