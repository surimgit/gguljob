import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BarChart2,
  Info,
  Monitor,
  Server,
  Database,
  Cloud,
  Bot,
  Smartphone,
  ChevronDown,
  ChevronUp,
  X,
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Code,
  Link,
  Eye,
  Pencil,
} from "lucide-react";
import Markdown from "react-markdown";
import toast from "react-hot-toast";

import type { TeamDashboard, BackendProjectEditStatus } from "../../../types/project";
import { getProjectEditForm, updateProject } from "../../../api/projects";

/* ── 타입 ── */
type ProjectStatus = "active" | "recruiting" | "done" | "paused";

interface ProjectSettingsProps {
  dashboard?: TeamDashboard | null;
  projectId?: number;
}

/* ── 상태 매핑 ── */
const STATUS_TO_BACKEND: Record<ProjectStatus, BackendProjectEditStatus> = {
  active: "PROCEEDING",
  recruiting: "RECRUITING",
  done: "DONE",
  paused: "STOPPED",
};
const BACKEND_TO_STATUS: Record<BackendProjectEditStatus, ProjectStatus> = {
  PROCEEDING: "active",
  RECRUITING: "recruiting",
  DONE: "done",
  STOPPED: "paused",
};

/* ── 스킬 이름 ↔ ID 매핑 (DB 기준) ── */
const SKILL_NAME_TO_ID: Record<string, number> = {
  React: 1, "Vue.js": 2, "Vue": 2, "Next.js": 19, JavaScript: 16, TypeScript: 17,
  "HTML/CSS": 18, Swift: 66, jQuery: 46,
  Java: 3, "Spring Boot": 4, Python: 5, MySQL: 6, "Node.js": 20,
  C: 13, "C#": 14, "C++": 15, PostgreSQL: 22, MariaDB: 23, MongoDB: 24,
  PHP: 25, ".NET": 26, "Nest.js": 27, NestJS: 27, Kafka: 28, "Oracle DB": 21,
  JPA: 43, MyBatis: 44, FastAPI: 45, Django: 63, Flask: 64, MSA: 59,
  JSP: 42, MSSQL: 41,
  "RDBMS/DBMS": 54, Tibero: 60,
  AWS: 7, Docker: 8, Kubernetes: 9, Jenkins: 10, Git: 11, Redis: 12,
  Linux: 29, Azure: 30, GCP: 31, Nginx: 65,
  PyTorch: 37, TensorFlow: 38, OpenCV: 50, Hadoop: 51,
  RAG: 56, LLM: 57, MLOps: 67, AI: 70,
  Android: 32, iOS: 33, Kotlin: 34, Flutter: 35, "React Native": 36, Unity: 52,
  Figma: 40, Jira: 39,
};
const SKILL_ID_TO_NAME: Record<number, string> = {};
for (const [name, id] of Object.entries(SKILL_NAME_TO_ID)) {
  if (!SKILL_ID_TO_NAME[id]) SKILL_ID_TO_NAME[id] = name;
}

/* ── 상수 ── */
const STATUS_OPTIONS: {
  key: ProjectStatus;
  label: string;
  dotColor: string;
  selectedBg: string;
  selectedBorder: string;
  selectedText: string;
}[] = [
  {
    key: "active",
    label: "진행중",
    dotColor: "var(--color-success)",
    selectedBg: "rgba(34,197,94,0.1)",
    selectedBorder: "var(--color-success)",
    selectedText: "var(--color-success)",
  },
  {
    key: "recruiting",
    label: "모집중",
    dotColor: "var(--color-primary)",
    selectedBg: "var(--color-primary-soft)",
    selectedBorder: "var(--color-primary)",
    selectedText: "var(--color-primary-hover)",
  },
  {
    key: "done",
    label: "완료",
    dotColor: "var(--color-text-tertiary)",
    selectedBg: "var(--color-background)",
    selectedBorder: "var(--color-text-tertiary)",
    selectedText: "var(--color-text-secondary)",
  },
  {
    key: "paused",
    label: "중단",
    dotColor: "var(--color-error)",
    selectedBg: "rgba(239,68,68,0.1)",
    selectedBorder: "var(--color-error)",
    selectedText: "var(--color-error)",
  },
];

const DOMAINS = [
  "웹기술",
  "웹디자인",
  "모바일",
  "AIoT",
  "인공지능",
  "빅데이터",
  "블록체인",
  "자율주행",
  "핀테크",
  "메타버스",
];

const TECH_CATEGORIES: {
  key: string;
  label: string;
  icon: React.ElementType;
  stacks: string[];
}[] = [
  {
    key: "frontend",
    label: "Frontend",
    icon: Monitor,
    stacks: [
      "React",
      "Vue",
      "Angular",
      "Next.js",
      "Nuxt.js",
      "Svelte",
      "TypeScript",
      "JavaScript",
      "TailwindCSS",
      "Sass",
    ],
  },
  {
    key: "backend",
    label: "Backend",
    icon: Server,
    stacks: [
      "Spring Boot",
      "Django",
      "FastAPI",
      "Express",
      "NestJS",
      "Go",
      "Rust",
      "Node.js",
      "Kotlin",
      "Java",
    ],
  },
  {
    key: "database",
    label: "Database",
    icon: Database,
    stacks: [
      "MySQL",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "SQLite",
      "MariaDB",
      "Elasticsearch",
      "DynamoDB",
    ],
  },
  {
    key: "infra",
    label: "Infra",
    icon: Cloud,
    stacks: [
      "Docker",
      "Kubernetes",
      "AWS",
      "GCP",
      "Azure",
      "Nginx",
      "Jenkins",
      "GitHub Actions",
      "Terraform",
    ],
  },
  {
    key: "ai",
    label: "AI",
    icon: Bot,
    stacks: [
      "PyTorch",
      "TensorFlow",
      "OpenAI",
      "Hugging Face",
      "LangChain",
      "scikit-learn",
      "Pandas",
      "NumPy",
    ],
  },
  {
    key: "mobile",
    label: "Mobile",
    icon: Smartphone,
    stacks: [
      "React Native",
      "Flutter",
      "Swift",
      "Kotlin",
      "Jetpack Compose",
      "SwiftUI",
    ],
  },
];

/* ── 스킬을 카테고리에 매핑 ── */
const SKILL_TO_CATEGORY: Record<string, string> = {};
TECH_CATEGORIES.forEach((cat) => {
  cat.stacks.forEach((stack) => {
    SKILL_TO_CATEGORY[stack.toLowerCase()] = cat.key;
  });
});

const skillsToTechStacks = (skills: string[]): Record<string, string[]> => {
  const result: Record<string, string[]> = {};
  skills.forEach((skill) => {
    const category = SKILL_TO_CATEGORY[skill.toLowerCase()];
    if (category) {
      (result[category] ??= []).push(skill);
    }
  });
  return result;
};

/* ── 컴포넌트 ── */
const ProjectSettings = ({ dashboard, projectId }: ProjectSettingsProps) => {
  const info = dashboard?.projectInfo;
  const gitRepo = dashboard?.gitRepoInfo;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMembers, setEditMembers] = useState<{ userId: number; role: string }[]>([]);

  const [status, setStatus] = useState<ProjectStatus>("active");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [descTab, setDescTab] = useState<"edit" | "preview">("edit");
  const descRef = useRef<HTMLTextAreaElement>(null);

  const insertMd = useCallback((prefix: string, suffix = "") => {
    const ta = descRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = description.slice(start, end);
    const replacement = `${prefix}${selected || "텍스트"}${suffix}`;
    const next = description.slice(0, start) + replacement + description.slice(end);
    setDescription(next);
    requestAnimationFrame(() => {
      ta.focus();
      const cursorPos = start + prefix.length;
      const cursorEnd = cursorPos + (selected || "텍스트").length;
      ta.setSelectionRange(cursorPos, cursorEnd);
    });
  }, [description]);

  const [domains, setDomains] = useState<string[]>([]);
  const [gitUrl, setGitUrl] = useState(gitRepo?.repoUrl ?? "");
  const [techStacks, setTechStacks] = useState<Record<string, string[]>>({});
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const allSelected = useMemo(
    () => Object.values(techStacks).flat(),
    [techStacks]
  );

  const [initialSnapshot, setInitialSnapshot] = useState<string>("");

  // GET /edit → 폼 초기화
  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    getProjectEditForm(projectId)
      .then(({ data }) => {
        const form = data.data;
        const mappedStatus = BACKEND_TO_STATUS[form.status] ?? "active";
        setStatus(mappedStatus);
        setName(form.title ?? "");
        setDescription(form.description ?? "");
        setDomains(form.domain ? [form.domain] : []);
        setEditMembers(form.members.map(m => ({ userId: m.userId, role: m.role })));

        // skillIds → 이름 → 카테고리별 분류
        const skillNames = form.skillIds
          .map(id => SKILL_ID_TO_NAME[id])
          .filter(Boolean) as string[];
        setTechStacks(skillsToTechStacks(skillNames));

        // 초기 스냅샷 저장
        setInitialSnapshot(JSON.stringify({
          status: mappedStatus,
          name: form.title ?? "",
          description: form.description ?? "",
          domains: form.domain ? [form.domain] : [],
          techStacks: skillsToTechStacks(skillNames),
        }));
      })
      .catch((err) => {
        console.error("프로젝트 설정 로드 실패:", err);
        // 폴백: dashboard 데이터 사용
        setInitialSnapshot(JSON.stringify({
          status: "active",
          name: info?.title ?? "",
          description: info?.description ?? "",
          domains: info?.domain ? [info.domain] : [],
          techStacks: skillsToTechStacks(info?.skills ?? []),
        }));
      })
      .finally(() => setLoading(false));
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasChanges = useMemo(() => {
    if (!initialSnapshot) return false;
    const current = JSON.stringify({ status, name, description, domains, techStacks });
    return current !== initialSnapshot;
  }, [status, name, description, domains, techStacks, initialSnapshot]);

  const toggleDomain = (d: string) =>
    setDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  const toggleStack = (category: string, stack: string) => {
    setTechStacks((prev) => {
      const list = prev[category] ?? [];
      const next = list.includes(stack)
        ? list.filter((s) => s !== stack)
        : [...list, stack];
      return { ...prev, [category]: next };
    });
  };

  const removeStack = (stack: string) => {
    setTechStacks((prev) => {
      const next: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(prev)) {
        next[k] = v.filter((s) => s !== stack);
      }
      return next;
    });
  };

  // PATCH 저장
  const handleSave = async () => {
    if (!projectId || saving) return;
    const allSkillNames = Object.values(techStacks).flat();
    const skillIds = allSkillNames
      .map(n => SKILL_NAME_TO_ID[n])
      .filter((id): id is number => id != null);

    setSaving(true);
    try {
      await updateProject(projectId, {
        status: STATUS_TO_BACKEND[status],
        title: name,
        teamName: info?.teamName,
        description,
        domain: domains[0] ?? "",
        skillIds,
        members: editMembers,
      });
      toast.success("프로젝트 설정이 저장되었습니다.");
      // 스냅샷 갱신
      setInitialSnapshot(JSON.stringify({ status, name, description, domains, techStacks }));
    } catch (err) {
      console.error("프로젝트 설정 저장 실패:", err);
      toast.error("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  /* ── 공통 입력 스타일 ── */
  const inputStyle = (hasValue: boolean) => ({
    border: `2px solid ${hasValue ? "var(--color-primary)" : "var(--color-border)"}`,
    color: "var(--color-text-primary)",
  });

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <p style={{ color: "var(--color-text-tertiary)" }}>설정을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-5 pb-28">
      {/* 페이지 타이틀 */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">✏️</span>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            프로젝트 설정
          </h1>
        </div>
      </div>

      {/* ── 2컬럼 그리드 (데스크톱) / 1컬럼 (모바일) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">

      {/* ── 좌측 컬럼 ── */}
      <div className="flex flex-col gap-5">

      {/* ── 섹션 1: 프로젝트 상태 ── */}
      <section
        className="rounded-2xl p-6 shadow-sm"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          className="flex items-center gap-2 text-base font-bold mb-5"
          style={{ color: "var(--color-text-primary)" }}
        >
          <BarChart2
            className="w-4 h-4"
            style={{ color: "var(--color-primary)" }}
          />
          프로젝트 상태
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => {
            const sel = status === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setStatus(opt.key)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm font-medium cursor-pointer transition-colors"
                style={{
                  background: sel ? opt.selectedBg : "transparent",
                  borderColor: sel
                    ? opt.selectedBorder
                    : "var(--color-border)",
                  color: sel ? opt.selectedText : "var(--color-text-secondary)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: opt.dotColor }}
                />
                {opt.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 섹션 2: 기본 정보 ── */}
      <section
        className="rounded-2xl p-6 shadow-sm"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          className="flex items-center gap-2 text-base font-bold mb-5"
          style={{ color: "var(--color-text-primary)" }}
        >
          📋 기본 정보
        </div>

        {/* 프로젝트명 */}
        <div className="mb-4">
          <label
            className="text-sm font-semibold mb-1.5 block"
            style={{ color: "var(--color-text-primary)" }}
          >
            프로젝트명 <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <input
            type="text"
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="프로젝트명을 입력하세요"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle(!!name)}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--color-primary)")
            }
            onBlur={(e) => {
              if (!name)
                e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          />
          <p
            className="text-xs text-right mt-1"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {name.length}/50
          </p>
        </div>

        {/* 프로젝트 설명 (마크다운 에디터) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              프로젝트 설명
            </label>
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <button
                onClick={() => setDescTab("edit")}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  background: descTab === "edit" ? "var(--color-primary)" : "transparent",
                  color: descTab === "edit" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                }}
              >
                <Pencil className="w-3 h-3" />
                편집
              </button>
              <button
                onClick={() => setDescTab("preview")}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  background: descTab === "preview" ? "var(--color-primary)" : "transparent",
                  color: descTab === "preview" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                }}
              >
                <Eye className="w-3 h-3" />
                프리뷰
              </button>
            </div>
          </div>

          {descTab === "edit" ? (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--color-border)" }}
            >
              {/* 툴바 */}
              <div
                className="flex items-center gap-0.5 px-2 py-1.5 border-b"
                style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}
              >
                {[
                  { icon: Heading2, action: () => insertMd("## "), title: "제목" },
                  { icon: Bold, action: () => insertMd("**", "**"), title: "굵게" },
                  { icon: Italic, action: () => insertMd("*", "*"), title: "기울임" },
                  { icon: Code, action: () => insertMd("`", "`"), title: "인라인 코드" },
                  { icon: List, action: () => insertMd("- "), title: "목록" },
                  { icon: ListOrdered, action: () => insertMd("1. "), title: "순서 목록" },
                  { icon: Link, action: () => insertMd("[", "](url)"), title: "링크" },
                ].map(({ icon: Icon, action, title }) => (
                  <button
                    key={title}
                    type="button"
                    onClick={action}
                    title={title}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-white transition-colors"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
              {/* 편집 영역 */}
              <textarea
                ref={descRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="마크다운으로 프로젝트를 설명해주세요&#10;&#10;예: ## 개요&#10;이 프로젝트는..."
                className="w-full px-4 py-3 text-sm outline-none h-48 resize-none font-mono"
                style={{ background: "var(--color-surface)", color: "var(--color-text-primary)" }}
              />
            </div>
          ) : (
            <div
              className="rounded-xl px-5 py-4 h-48 overflow-y-auto prose prose-sm max-w-none"
              style={{
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
              }}
            >
              {description ? (
                <Markdown
                  components={{
                    h1: ({ children }) => <h1 className="text-xl font-bold mt-3 mb-2" style={{ color: "var(--color-text-primary)" }}>{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-1.5" style={{ color: "var(--color-text-primary)" }}>{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-bold mt-2 mb-1" style={{ color: "var(--color-text-primary)" }}>{children}</h3>,
                    p: ({ children }) => <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--color-text-secondary)" }}>{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>{children}</ol>,
                    li: ({ children }) => <li className="mb-0.5">{children}</li>,
                    code: ({ children }) => (
                      <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "var(--color-background)", color: "var(--color-primary-hover)" }}>
                        {children}
                      </code>
                    ),
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-blue)" }}>
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => <strong className="font-bold" style={{ color: "var(--color-text-primary)" }}>{children}</strong>,
                  }}
                >
                  {description}
                </Markdown>
              ) : (
                <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                  프리뷰할 내용이 없습니다.
                </p>
              )}
            </div>
          )}
          <p
            className="text-xs text-right mt-1"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {description.length} 자
          </p>
        </div>

        {/* 도메인 */}
        <div className="mb-4">
          <label
            className="text-sm font-semibold mb-1.5 block"
            style={{ color: "var(--color-text-primary)" }}
          >
            도메인
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {DOMAINS.map((d) => {
              const sel = domains.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDomain(d)}
                  className="px-3 py-1 rounded-full border text-xs font-medium cursor-pointer transition-colors"
                  style={{
                    borderColor: sel
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                    color: sel
                      ? "var(--color-primary-hover)"
                      : "var(--color-text-secondary)",
                    background: sel
                      ? "var(--color-primary-soft)"
                      : "var(--color-surface)",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        {/* Git URL */}
        <div>
          <label
            className="text-sm font-semibold mb-1.5 block"
            style={{ color: "var(--color-text-primary)" }}
          >
            Git 저장소 URL
          </label>
          <input
            type="text"
            value={gitUrl}
            onChange={(e) => setGitUrl(e.target.value)}
            placeholder="https://github.com/..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={inputStyle(!!gitUrl)}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--color-primary)")
            }
            onBlur={(e) => {
              if (!gitUrl)
                e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          />
          <div
            className="flex items-center gap-2 mt-2 px-4 py-2.5 rounded-xl text-xs"
            style={{
              background: "var(--color-primary-soft)",
              color: "var(--color-primary-hover)",
            }}
          >
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            저장소 URL을 입력하면 커밋, MR 등의 활동이 자동으로 동기화됩니다
          </div>
        </div>
      </section>

      </div>{/* 좌측 컬럼 끝 */}

      {/* ── 우측 컬럼 ── */}
      <div className="flex flex-col gap-5">

      {/* ── 섹션 3: 기술 스택 ── */}
      <section
        className="rounded-2xl p-6 shadow-sm"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          className="flex items-center gap-2 text-base font-bold mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          ⚙️ 기술 스택
        </div>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          카테고리별로 사용할 기술을 선택하세요
        </p>

        {/* 아코디언 */}
        <div className="flex flex-col gap-2">
          {TECH_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isOpen = openCategory === cat.key;
            const count = (techStacks[cat.key] ?? []).length;

            return (
              <div key={cat.key}>
                <button
                  onClick={() =>
                    setOpenCategory(isOpen ? null : cat.key)
                  }
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: isOpen
                      ? "var(--color-primary-soft)"
                      : "var(--color-background)",
                    border: isOpen
                      ? "1px solid var(--color-primary)"
                      : "1px solid transparent",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className="w-4 h-4"
                      style={{ color: "var(--color-text-secondary)" }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {cat.label}
                    </span>
                    {count > 0 && (
                      <span
                        className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white"
                        style={{ background: "var(--color-primary)" }}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                  {isOpen ? (
                    <ChevronUp
                      className="w-4 h-4"
                      style={{ color: "var(--color-text-tertiary)" }}
                    />
                  ) : (
                    <ChevronDown
                      className="w-4 h-4"
                      style={{ color: "var(--color-text-tertiary)" }}
                    />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-2 flex flex-wrap gap-2">
                    {cat.stacks.map((stack) => {
                      const sel = (techStacks[cat.key] ?? []).includes(stack);
                      return (
                        <button
                          key={stack}
                          onClick={() => toggleStack(cat.key, stack)}
                          className="px-3 py-1 rounded-full border text-xs font-medium cursor-pointer transition-colors"
                          style={{
                            borderColor: sel
                              ? "var(--color-primary)"
                              : "var(--color-border)",
                            color: sel
                              ? "var(--color-primary-hover)"
                              : "var(--color-text-secondary)",
                            background: sel
                              ? "var(--color-primary-soft)"
                              : "var(--color-surface)",
                          }}
                        >
                          {stack}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 선택된 스택 요약 */}
        {allSelected.length > 0 && (
          <div className="mt-4">
            <p
              className="text-sm font-semibold mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              선택된 기술 스택
            </p>
            <div className="flex flex-wrap gap-2">
              {allSelected.map((stack) => (
                <span
                  key={stack}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--color-primary-soft)",
                    color: "var(--color-primary-hover)",
                    border: "1px solid var(--color-primary)",
                  }}
                >
                  {stack}
                  <button
                    onClick={() => removeStack(stack)}
                    className="transition-colors"
                    style={{ color: "var(--color-text-tertiary)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--color-error)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        "var(--color-text-tertiary)")
                    }
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── 위험 영역 배너 ── */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between"
        style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
      >
        <div>
          <p
            className="text-sm font-bold"
            style={{ color: "var(--color-error)" }}
          >
            프로젝트 삭제
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(239,68,68,0.7)" }}>
            이 작업은 되돌릴 수 없습니다
          </p>
        </div>
        <button
          className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors"
          style={{ background: "var(--color-error)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "#DC2626")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--color-error)")
          }
        >
          삭제하기
        </button>
      </div>

      </div>{/* 우측 컬럼 끝 */}
      </div>{/* 그리드 끝 */}

      {/* ── 하단 고정 저장 버튼 ── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3"
        style={{ background: "var(--color-background)" }}
      >
        <button
          disabled={!hasChanges || saving}
          onClick={handleSave}
          className="w-full max-w-[1400px] mx-auto block py-4 rounded-2xl text-base font-bold transition-colors"
          style={
            hasChanges && !saving
              ? {
                  background: "var(--color-primary)",
                  color: "var(--color-text-primary)",
                }
              : {
                  background: "var(--color-border)",
                  color: "var(--color-text-tertiary)",
                  cursor: "not-allowed",
                }
          }
          onMouseEnter={(e) => {
            if (hasChanges && !saving)
              e.currentTarget.style.background = "var(--color-primary-hover)";
          }}
          onMouseLeave={(e) => {
            if (hasChanges && !saving)
              e.currentTarget.style.background = "var(--color-primary)";
          }}
        >
          {saving ? "저장 중..." : hasChanges ? "저장하기" : "변경사항 없음"}
        </button>
      </div>
    </div>
  );
};

export default ProjectSettings;
