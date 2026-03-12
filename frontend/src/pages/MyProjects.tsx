import { useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ── 타입 ── */

type ProjectStatus = "active" | "done";

interface Member {
  name: string;
  avatarColor?: string;
}

interface Project {
  id: string;
  domain: string;
  status: ProjectStatus;
  title: string;
  description: string;
  techStacks: string[];
  fe: { current: number; total?: number };
  be: { current: number; total?: number };
  leader: Member;
  lastMrAt?: string;
  completedAt?: string;
}

/* ── 상수 ── */

const DOMAIN_COLORS: Record<string, string> = {
  소셜: "var(--color-blue)",
  "AI/ML": "var(--color-warning)",
  에듀테크: "var(--color-warning)",
  커뮤니케이션: "var(--color-blue)",
  엔터테인먼트: "var(--color-warning)",
  개발도구: "var(--color-primary-hover)",
};

const AVATAR_COLORS = [
  "var(--color-primary)",
  "var(--color-blue)",
  "var(--color-success)",
  "#EC4899",
];

const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    domain: "소셜",
    status: "active",
    title: "꿀잡",
    description: "개발자 구직 매칭 및 팀 빌딩 플랫폼",
    techStacks: ["React", "TypeScript", "Spring", "MySQL"],
    fe: { current: 2, total: 3 },
    be: { current: 2, total: 2 },
    leader: { name: "김도현" },
    lastMrAt: "3분 전",
  },
  {
    id: "2",
    domain: "AI/ML",
    status: "active",
    title: "AI 코드 리뷰어",
    description: "GPT 기반 코드 리뷰 자동화 도구",
    techStacks: ["Python", "FastAPI", "React", "Docker"],
    fe: { current: 1, total: 2 },
    be: { current: 1, total: 1 },
    leader: { name: "이서연" },
    lastMrAt: "15분 전",
  },
  {
    id: "3",
    domain: "에듀테크",
    status: "active",
    title: "스터디 매칭",
    description: "관심 분야 기반 스터디 그룹 매칭 서비스",
    techStacks: ["Next.js", "TailwindCSS", "PostgreSQL"],
    fe: { current: 1, total: 1 },
    be: { current: 1, total: 2 },
    leader: { name: "박민수" },
    lastMrAt: "1시간 전",
  },
  {
    id: "4",
    domain: "개발도구",
    status: "done",
    title: "포트폴리오 빌더",
    description: "개발자를 위한 포트폴리오 생성 도구",
    techStacks: ["Vue", "Node.js", "MongoDB"],
    fe: { current: 2 },
    be: { current: 1 },
    leader: { name: "최유진" },
    completedAt: "2025.01.20",
  },
  {
    id: "5",
    domain: "커뮤니케이션",
    status: "done",
    title: "팀 채팅",
    description: "실시간 팀 메신저 프로토타입",
    techStacks: ["React", "Socket.io", "Redis"],
    fe: { current: 1 },
    be: { current: 2 },
    leader: { name: "정하나" },
    completedAt: "2024.12.05",
  },
];

/* ── 컴포넌트 ── */

const ProjectCard = ({ project }: { project: Project }) => {
  const domainColor =
    DOMAIN_COLORS[project.domain] ?? "var(--color-primary-hover)";
  const isActive = project.status === "active";
  const avatarColor = AVATAR_COLORS[Number(project.id) % AVATAR_COLORS.length];

  return (
    <div
      className="rounded-2xl p-5 shadow-sm flex flex-col gap-3 border"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: domainColor }}>
          {project.domain}
        </span>
        <span
          className="flex items-center gap-1 text-xs font-medium"
          style={{
            color: isActive
              ? "var(--color-success)"
              : "var(--color-text-tertiary)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: isActive
                ? "var(--color-success)"
                : "var(--color-text-tertiary)",
            }}
          />
          {isActive ? "진행중" : "완료"}
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
        <p
          className="text-sm leading-relaxed mt-1"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {project.description}
        </p>
      </div>

      {/* 기술 스택 */}
      <div className="flex flex-wrap gap-1.5">
        {project.techStacks.map((stack) => (
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

      {/* 하단 */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-2 text-xs font-bold">
          <span style={{ color: "var(--color-blue)" }}>
            FE {project.fe.current}
            {project.fe.total != null && `/${project.fe.total}`}
          </span>
          <span style={{ color: "var(--color-success)" }}>
            BE {project.be.current}
            {project.be.total != null && `/${project.be.total}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: avatarColor }}
          >
            {project.leader.name[0]}
          </span>
          <span
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {project.leader.name}
          </span>
        </div>
      </div>

      {/* MR / 완료일 */}
      <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
        {isActive
          ? `최근 MR: ${project.lastMrAt}`
          : `완료: ${project.completedAt}`}
      </p>
    </div>
  );
};

const MyProjects = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProjectStatus>("active");

  const activeProjects = MOCK_PROJECTS.filter((p) => p.status === "active");
  const doneProjects = MOCK_PROJECTS.filter((p) => p.status === "done");
  const currentProjects = tab === "active" ? activeProjects : doneProjects;

  return (
    <div
      style={{ backgroundColor: "var(--color-background)" }}
      className="min-h-screen"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
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
          <button
            type="button"
            onClick={() => setTab("active")}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors"
            style={{
              backgroundColor:
                tab === "active"
                  ? "var(--color-primary)"
                  : "var(--color-surface)",
              color:
                tab === "active"
                  ? "var(--color-text-primary)"
                  : "var(--color-text-secondary)",
              border:
                tab === "active" ? "none" : "1px solid var(--color-border)",
            }}
          >
            진행중
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{
                backgroundColor:
                  tab === "active" ? "rgba(0,0,0,0.15)" : "var(--color-border)",
                color:
                  tab === "active"
                    ? "var(--color-text-primary)"
                    : "var(--color-text-tertiary)",
              }}
            >
              {activeProjects.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("done")}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors"
            style={{
              backgroundColor:
                tab === "done"
                  ? "var(--color-primary)"
                  : "var(--color-surface)",
              color:
                tab === "done"
                  ? "var(--color-text-primary)"
                  : "var(--color-text-secondary)",
              border: tab === "done" ? "none" : "1px solid var(--color-border)",
            }}
          >
            완료
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{
                backgroundColor:
                  tab === "done" ? "rgba(0,0,0,0.15)" : "var(--color-border)",
                color:
                  tab === "done"
                    ? "var(--color-text-primary)"
                    : "var(--color-text-tertiary)",
              }}
            >
              {doneProjects.length}
            </span>
          </button>
        </div>

        {/* 카운트 */}
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          총 {currentProjects.length}개 프로젝트
        </p>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {currentProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
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
      </div>
    </div>
  );
};

export default MyProjects;
