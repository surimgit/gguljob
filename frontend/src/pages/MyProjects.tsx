import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "../stores/projectStore";
import { getRoleDisplayName, getRoleColor } from "../constants/skills";
import { CATEGORY_COLORS, THUMBNAIL_GRADIENTS } from "../constants/domains";
import { Pagination } from "../components/common";
import type { ProjectSimple, BackendProjectStatus } from "../types/project";
import myProjectImg from "../assets/images/myproject.png";

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
      className={`border-2 border-[#e5e7eb] cursor-pointer flex flex-col gap-[14px] px-[26px] py-[26px] rounded-[18px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.03)] w-full min-h-[280px] hover:shadow-lg hover:border-primary-hover hover:bg-primary-soft transition-all duration-300 ${project.status === 'DONE' ? 'bg-[#EDEBE6]' : 'bg-white'}`}
      onClick={() => navigate(`/my-projects/${project.projectId}`)}
    >
      {/* 상단: 상태(좌) + 리더(우) */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-[5px]">
          <div className="rounded-[3.5px] size-[5px]" style={{ backgroundColor: statusStyle.dot }} />
          <p className="font-semibold text-xs leading-[18px]" style={{ color: statusStyle.text }}>
            {STATUS_LABEL[project.status]}
          </p>
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

      {/* 카테고리 */}
      <p className="font-semibold text-base leading-[18px]" style={{ color: categoryColor }}>
        {project.domain || "미정"}
      </p>

      {/* 제목 */}
      <p className="font-bold text-text-primary text-xl tracking-[-0.3px] w-full">
        {project.title}
      </p>

      {/* 설명 */}
      <p className="font-bold text-text-secondary text-sm leading-[20.8px] line-clamp-2 w-full">
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

      {/* 하단: 포지션 슬롯 */}
      <div className="mt-auto border-t border-[#f0ebe3] flex flex-wrap gap-x-[12px] gap-y-[4px] pt-[11px] w-full">
        {roles.map(([role, count]) => (
          <p key={role} className="font-semibold text-xs whitespace-nowrap" style={{ color: getRoleColor(role) }}>
            {getRoleDisplayName(role)} <span className="font-black">{count}</span>
          </p>
        ))}
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

  const GRID_SIZE = 9;
  const projectsPerPage = GRID_SIZE;
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
      {/* 히어로 배너 + 이미지 래퍼 */}
      <div className="relative w-[calc(100%+32px)] sm:w-[calc(100%+48px)] lg:w-[calc(100%+64px)] -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
        <section
          data-navbar-hero
          className="overflow-hidden bg-primary-soft/[0.36]"
          style={{ height: '380px' }}
        >
          <div className="max-w-[1400px] mx-auto pr-4 sm:pr-6 lg:pr-8 flex flex-col justify-center pt-13 pb-14 pl-[8%]">
            <h1
              className="font-bold"
              style={{ fontSize: '40px', color: '#111827', lineHeight: '1.35' }}
            >
              내 프로젝트
            </h1>
            <p
              className="mt-4 mb-2"
              style={{ fontSize: '22px', color: '#4A5565' }}
            >
              참여 중인 프로젝트와 완료한 프로젝트를 관리하세요
            </p>

            {/* 새 프로젝트 만들기 버튼 + 최신 진행 중 프로젝트 카드 */}
            <div className="flex gap-4 mt-4 items-stretch">
              {/* 새 프로젝트 만들기 버튼 */}
              <button
                type="button"
                onClick={() => navigate("/projects/new")}
                className="rounded-[16px] border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer w-[220px] h-[170px] flex-shrink-0 transition-all duration-300 hover:border-primary-hover hover:bg-white/60 hover:shadow-lg"
                style={{ borderColor: "rgba(0,0,0,0.15)" }}
              >
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
                >
                  <Plus className="w-5 h-5" style={{ color: "var(--color-text-tertiary)" }} />
                </span>
                <span className="text-base font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                  새 프로젝트 만들기
                </span>
              </button>

              {(() => {
                const latestProjects = [...myProjects]
                  .filter((p) => p.status !== 'DONE')
                  .sort((a, b) => b.projectId - a.projectId)
                  .slice(0, 2);

                if (latestProjects.length === 0) return null;

                return latestProjects.map((latest) => {
                  const gradient = THUMBNAIL_GRADIENTS[latest.domain] ?? 'linear-gradient(149deg, #F5F5F5, #E0E0E0)';
                  const categoryColor = CATEGORY_COLORS[latest.domain] ?? '#6b7280';

                  return (
                    <div
                      key={latest.projectId}
                      className="bg-white border border-[#f0ebe3] overflow-hidden relative rounded-[16px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.06)] w-[220px] h-[170px] flex-shrink-0 cursor-pointer text-left transition-all duration-300 hover:scale-[1.06] hover:shadow-[0px_12px_32px_0px_rgba(0,0,0,0.14)]"
                      onClick={() => navigate(`/my-projects/${latest.projectId}`)}
                    >
                      {/* 상단 썸네일 */}
                      <div
                        className="absolute top-0 left-0 w-full h-[100px] overflow-hidden"
                        style={{ background: latest.imageUrl ? undefined : gradient }}
                      >
                        {latest.imageUrl && (
                          <img src={latest.imageUrl} alt={latest.title} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-[10px] right-[10px] bg-[rgba(255,255,255,0.7)] rounded-[8px] px-[8px] py-[2px]">
                          <p className="font-semibold text-sm leading-[15px]" style={{ color: categoryColor }}>
                            최근 프로젝트
                          </p>
                        </div>
                      </div>
                      {/* 하단 정보 */}
                      <div className="absolute top-[100px] left-0 w-full bottom-0 flex flex-col px-[16px] pt-[15px] pb-[8px]">
                        <p className="font-semibold text-text-primary text-base leading-[20px] break-words">
                          {latest.title}
                        </p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

        </div>
        </section>

        {/* 이미지 — 배너 오른쪽에 걸침 */}
        <img
          src={myProjectImg}
          alt="내 프로젝트"
          className="absolute right-[8%] top-[4%] hidden xl:block"
          style={{ width: '450px', height: 'auto', zIndex: 10 }}
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* 탭 */}
        <div className="flex gap-2 mb-4">
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
          className="text-base mb-4"
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
