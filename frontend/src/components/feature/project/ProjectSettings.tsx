import { useState, useMemo } from "react";
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
} from "lucide-react";

/* ── 타입 ── */
type ProjectStatus = "active" | "recruiting" | "done" | "paused";

interface TeamMember {
  id: string;
  name: string;
  position: string;
  email: string;
  avatarColor?: string;
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
  "콘텐츠",
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

const AVATAR_COLORS = [
  "var(--color-primary)",
  "var(--color-blue)",
  "var(--color-success)",
  "#EC4899",
];

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  PM: { bg: "#EDE9FE", color: "#7C3AED" },
  Backend: { bg: "#DCFCE7", color: "var(--color-success)" },
  Frontend: { bg: "var(--color-primary-soft)", color: "var(--color-primary-hover)" },
  "AI/ML": { bg: "#FEF3C7", color: "var(--color-warning)" },
};

/* ── 초기 목업 데이터 ── */
const INITIAL = {
  createdAt: "2026-02-15",
  status: "active" as ProjectStatus,
  name: "꿀잡 - AI 매칭 플랫폼",
  description:
    "GitHub 분석과 AI 매칭을 통해 개발자에게 최적의 프로젝트 팀을 추천하는 서비스입니다.",
  domains: ["웹기술"],
  gitUrl: "https://github.com/ssafy/gguljob",
  techStacks: {
    frontend: ["React", "TypeScript"],
    backend: ["Spring Boot"],
    database: ["PostgreSQL", "Redis"],
  } as Record<string, string[]>,
  members: [
    { id: "1", name: "김도현", position: "PM", email: "dohyun@ssafy.com" },
    { id: "2", name: "이서준", position: "Backend", email: "seojun@ssafy.com" },
    { id: "3", name: "박지민", position: "Frontend", email: "jimin@ssafy.com" },
    { id: "4", name: "정하은", position: "AI/ML", email: "haeun@ssafy.com" },
  ] as TeamMember[],
};

/* ── 컴포넌트 ── */
const ProjectSettings = () => {
  const [status, setStatus] = useState<ProjectStatus>(INITIAL.status);
  const [name, setName] = useState(INITIAL.name);
  const [description, setDescription] = useState(INITIAL.description);
  const [domains, setDomains] = useState<string[]>(INITIAL.domains);
  const [gitUrl, setGitUrl] = useState(INITIAL.gitUrl);
  const [techStacks, setTechStacks] = useState<Record<string, string[]>>(
    INITIAL.techStacks
  );
  const [members, setMembers] = useState<TeamMember[]>(INITIAL.members);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  // 새 팀원 추가 폼
  const [newName, setNewName] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const allSelected = useMemo(
    () => Object.values(techStacks).flat(),
    [techStacks]
  );

  const hasChanges = useMemo(() => {
    return (
      status !== INITIAL.status ||
      name !== INITIAL.name ||
      description !== INITIAL.description ||
      JSON.stringify(domains) !== JSON.stringify(INITIAL.domains) ||
      gitUrl !== INITIAL.gitUrl ||
      JSON.stringify(techStacks) !== JSON.stringify(INITIAL.techStacks) ||
      JSON.stringify(members) !== JSON.stringify(INITIAL.members)
    );
  }, [status, name, description, domains, gitUrl, techStacks, members]);

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

  const removeMember = (id: string) =>
    setMembers((prev) => prev.filter((m) => m.id !== id));

  const addMember = () => {
    if (!newName.trim() || !newPosition.trim()) return;
    const member: TeamMember = {
      id: Date.now().toString(),
      name: newName.trim(),
      position: newPosition.trim(),
      email: newEmail.trim(),
    };
    setMembers((prev) => [...prev, member]);
    setNewName("");
    setNewPosition("");
    setNewEmail("");
  };

  const canAddMember = newName.trim() && newPosition.trim();

  /* ── 공통 입력 스타일 ── */
  const inputStyle = (hasValue: boolean) => ({
    border: `2px solid ${hasValue ? "var(--color-primary)" : "var(--color-border)"}`,
    color: "var(--color-text-primary)",
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-5 pb-28">
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
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          생성일: {INITIAL.createdAt}
        </p>
      </div>

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

        {/* 프로젝트 설명 */}
        <div className="mb-4">
          <label
            className="text-sm font-semibold mb-1.5 block"
            style={{ color: "var(--color-text-primary)" }}
          >
            프로젝트 설명
          </label>
          <textarea
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="프로젝트에 대해 설명해주세요"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none h-24 resize-none"
            style={inputStyle(!!description)}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--color-primary)")
            }
            onBlur={(e) => {
              if (!description)
                e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          />
          <p
            className="text-xs text-right mt-1"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {description.length}/500
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

      {/* ── 섹션 4: 팀원 관리 ── */}
      <section
        className="rounded-2xl p-6 shadow-sm"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div
            className="flex items-center gap-2 text-base font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            👥 팀원 관리
          </div>
          <span
            className="text-sm font-bold"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {members.length}명
          </span>
        </div>

        {/* 팀원 목록 */}
        <div className="flex flex-col gap-2">
          {members.map((m, idx) => {
            const color = m.avatarColor || AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const roleStyle = ROLE_STYLES[m.position] || {
              bg: "var(--color-background)",
              color: "var(--color-text-secondary)",
            };
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "var(--color-background)" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: color }}
                >
                  {m.name.charAt(0)}
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {m.name}
                    </span>
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded-md"
                      style={{
                        background: roleStyle.bg,
                        color: roleStyle.color,
                      }}
                    >
                      {m.position}
                    </span>
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {m.email}
                  </span>
                </div>
                <button
                  onClick={() => removeMember(m.id)}
                  className="transition-opacity opacity-60 hover:opacity-100"
                  style={{ color: "var(--color-error)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* 새 팀원 추가 */}
        <div
          className="mt-3 rounded-xl p-4"
          style={{
            background: "var(--color-primary-soft)",
            border: "1px solid var(--color-primary)",
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="홍길동"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-primary)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-border)")
              }
            />
            <input
              type="text"
              placeholder="포지션"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-primary)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-border)")
              }
            />
          </div>
          <input
            type="email"
            placeholder="example@email.com (초대 알림용)"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none mt-3"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--color-primary)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--color-border)")
            }
          />
          <button
            onClick={addMember}
            disabled={!canAddMember}
            className="w-full py-3 rounded-xl text-sm font-bold mt-3 transition-colors"
            style={
              canAddMember
                ? {
                    background: "var(--color-primary)",
                    color: "white",
                  }
                : {
                    background: "var(--color-border)",
                    color: "var(--color-text-tertiary)",
                    cursor: "not-allowed",
                  }
            }
            onMouseEnter={(e) => {
              if (canAddMember)
                e.currentTarget.style.background = "var(--color-primary-hover)";
            }}
            onMouseLeave={(e) => {
              if (canAddMember)
                e.currentTarget.style.background = "var(--color-primary)";
            }}
          >
            팀원 추가
          </button>
        </div>
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

      {/* ── 하단 고정 저장 버튼 ── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3"
        style={{ background: "var(--color-background)" }}
      >
        <button
          disabled={!hasChanges}
          className="w-full max-w-xl mx-auto block py-4 rounded-2xl text-base font-bold transition-colors"
          style={
            hasChanges
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
            if (hasChanges)
              e.currentTarget.style.background = "var(--color-primary-hover)";
          }}
          onMouseLeave={(e) => {
            if (hasChanges)
              e.currentTarget.style.background = "var(--color-primary)";
          }}
        >
          {hasChanges ? "저장하기" : "변경사항 없음"}
        </button>
      </div>
    </div>
  );
};

export default ProjectSettings;
