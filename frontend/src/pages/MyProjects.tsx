import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import { getRoleDisplayName, getRoleColor } from "../constants/skills";
import { CATEGORY_COLORS } from "../constants/domains";
import { Pagination } from "../components/common";
import type { ProjectSimple, BackendProjectStatus } from "../types/project";

/* ── 컴포넌트 ── */

const STATUS_LABEL: Record<BackendProjectStatus, string> = {
  RECRUITING: '모집중', PROCEEDING: '진행중', DONE: '완료',
};

function getStatusStyle(status: BackendProjectStatus) {
  if (status === 'RECRUITING') return { dot: '#43b581', text: '#22c55e' };
  if (status === 'DONE') return { dot: '#9ca3af', text: '#9ca3af' };
  return { dot: '#f59e0b', text: '#f59e0b' };
}

const ProjectCard = ({ project }: { project: ProjectSimple }) => {
  const navigate = useNavigate();

  const categoryColor = CATEGORY_COLORS[project.domain] ?? '#6b7280';
  const statusStyle = getStatusStyle(project.status);

  const roles = Object.entries(project.roleCounts ?? {}).filter(([, count]) => count > 0);
  const visibleSkills = project.skills.slice(0, 3);
  const extraCount = project.skills.length - visibleSkills.length;

  return (
    <div
      className={`border-2 border-[#e5e7eb] cursor-pointer flex flex-col gap-[14px] px-[26px] py-[26px] rounded-[18px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.03)] w-full h-[280px] hover:shadow-lg hover:border-primary-hover hover:bg-primary-soft transition-all duration-200 ${project.status === 'DONE' ? 'bg-[#EDEBE6]' : 'bg-white'}`}
      onClick={() => navigate(`/my-projects/${project.projectId}`)}
    >
      {/* 상단: 카테고리 + 상태 */}
      <div className="flex items-center justify-between w-full">
        <p className="font-semibold text-base leading-[18px]" style={{ color: categoryColor }}>
          {project.domain || "미정"}
        </p>
        <div className="flex items-center gap-[5px]">
          <div className="rounded-[3.5px] size-[7px]" style={{ backgroundColor: statusStyle.dot }} />
          <p className="font-bold text-sm leading-[18px]" style={{ color: statusStyle.text }}>
            {STATUS_LABEL[project.status]}
          </p>
        </div>
      </div>

      {/* 제목 */}
      <p className="font-bold text-text-primary text-xl tracking-[-0.3px] w-full">
        {project.title}
      </p>

      {/* 설명 */}
      <p className="font-semibold text-text-secondary text-sm leading-[20.8px] line-clamp-2 w-full">
        {project.description || project.teamName || "\u00A0"}
      </p>

      {/* 기술 스택 뱃지 */}
      {project.skills.length > 0 && (
        <div className="flex flex-wrap gap-x-[5px] gap-y-[5px] w-full">
          {visibleSkills.map((tech) => (
            <span key={tech} className="bg-[#e5e7eb] border border-[#e5e7eb] font-semibold text-[#6b7280] text-xs px-[11px] py-[4px] rounded-[16px] mt-2">
              {tech}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="bg-[#e5e7eb] border border-[#e5e7eb] font-semibold text-[#6b7280] text-xs px-[11px] py-[4px] rounded-[16px] mt-2">
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {/* 하단: 직무 + 프로필 */}
      <div className="mt-auto border-t border-[#f0ebe3] flex items-center justify-between pt-[11px] w-full">
        <div className="flex gap-[12px]">
          {roles.map(([role, count]) => (
            <p key={role} className="font-semibold text-xs" style={{ color: getRoleColor(role) }}>
              {getRoleDisplayName(role)} <span className="font-black">{count}</span>
            </p>
          ))}
        </div>
        <div className="flex items-center gap-[8px]">
          {project.leaderProfileImageUrl ? (
            <img
              src={project.leaderProfileImageUrl}
              alt={project.leaderName}
              className="rounded-full size-[24px] object-cover"
            />
          ) : (
            <div className="rounded-full size-[24px] flex items-center justify-center bg-[#6366f1]">
              <p className="font-bold text-white text-[11px]">{project.leaderName?.[0] ?? '?'}</p>
            </div>
          )}
          <p className="font-semibold text-text-secondary text-sm">{project.leaderName}</p>
        </div>
      </div>

      {/* 완료일 */}
      {project.finishedAt && (
        <p className="text-xs text-[#9ca3af]">
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
  const [currentPage, setCurrentPage] = useState(1);

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

  // 최신순 정렬 (projectId 높은 순)
  const sortedProjects = [...currentProjects].sort((a, b) => b.projectId - a.projectId);

  // 페이지네이션: active 탭은 "만들기" 버튼이 1슬롯 차지 → 프로젝트 8개씩
  const GRID_SIZE = 9;
  const projectsPerPage = tab === "active" ? GRID_SIZE - 1 : GRID_SIZE;
  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / projectsPerPage));
  const pageProjects = sortedProjects.slice(
    (currentPage - 1) * projectsPerPage,
    currentPage * projectsPerPage,
  );

  return (
    <div
      style={{ backgroundColor: "var(--color-background)" }}
      className="min-h-screen"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* 헤더 */}
        <h1
          className="text-2xl sm:text-3xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          내 프로젝트
        </h1>
        <p
          className="text-sm sm:text-lg mt-3"
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
              onClick={() => { setTab(t.key); setCurrentPage(1); }}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-base font-bold transition-colors"
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
                className="text-sm px-2 py-0.5 rounded-full font-semibold"
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
          className="text-base mb-4 mt-8"
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
        {!myProjectsLoading && (<>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* 새 프로젝트 만들기 — 항상 첫 번째 칸 (진행중 탭) */}
            {tab === "active" && (
              <button
                type="button"
                onClick={() => navigate("/projects/new")}
                className="rounded-[18px] border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer h-[280px] transition-all duration-200 hover:border-primary-hover hover:bg-primary-soft hover:shadow-lg"
                style={{ borderColor: "#e5e7eb" }}
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
                  className="text-xl font-semibold mt-2"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  새 프로젝트 만들기
                </span>
                <span
                  className="text-base"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  팀원을 모집하고 프로젝트를 시작하세요
                </span>
              </button>
            )}

            {pageProjects.map((project) => (
              <ProjectCard key={project.projectId} project={project} />
            ))}
          </div>

          {/* 페이지네이션 */}
          <Pagination
            current={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
            className="py-10"
          />
        </>)}
      </div>
    </div>
  );
};

export default MyProjects;
