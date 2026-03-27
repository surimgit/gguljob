import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2,
  Info,
  Monitor,
  Server,
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
  Pen,
  Briefcase,
  PieChart,
  Database,
  Camera,
  Trash2,
} from "lucide-react";
import Markdown from "react-markdown";
import toast from "react-hot-toast";

import type { TeamDashboard, BackendProjectEditStatus } from "../../../types/project";
import { getProjectEditForm, updateProject, uploadProjectImage, deleteProjectImage, leaveProject, deleteProject } from "../../../api/projects";
import {
  SKILL_NAME_TO_ID as CANONICAL_SKILL_NAME_TO_ID,
  SKILL_ID_TO_NAME as CANONICAL_SKILL_ID_TO_NAME,
  SKILLS_BY_CATEGORY,
  SKILL_CATEGORY_META,
} from "../../../constants/skills";

/* ── 타입 ── */
type ProjectStatus = "active" | "recruiting" | "done" | "paused";

interface ProjectSettingsProps {
  dashboard?: TeamDashboard | null;
  projectId?: number;
  isLeader?: boolean;
  onSaved?: () => void;
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

const SKILL_NAME_TO_ID = CANONICAL_SKILL_NAME_TO_ID;
const SKILL_ID_TO_NAME = CANONICAL_SKILL_ID_TO_NAME;

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

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  FRONTEND: Monitor, BACKEND: Server, DATABASE: Database, DEVOPS: Cloud, DATA: PieChart,
  AI: Bot, MOBILE: Smartphone, PM: Briefcase, DESIGN: Pen,
};

const TECH_CATEGORIES = SKILL_CATEGORY_META.map((meta) => ({
  ...meta,
  icon: CATEGORY_ICONS[meta.key] ?? Info,
  stacks: SKILLS_BY_CATEGORY[meta.key] ?? [],
}));

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
const ProjectSettings = ({ dashboard, projectId, isLeader: isLeaderProp, onSaved }: ProjectSettingsProps) => {
  const navigate = useNavigate();
  const info = dashboard?.projectInfo;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isLeader = isLeaderProp ?? false;
  const [editMembers, setEditMembers] = useState<{ userId: number; role: string }[]>([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [status, setStatus] = useState<ProjectStatus>("active");
  const [originalTitle, setOriginalTitle] = useState("");
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

  const [domain, setDomain] = useState<string>("");
  const [techStacks, setTechStacks] = useState<Record<string, string[]>>({});
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const allSelected = useMemo(
    () => Object.values(techStacks).flat(),
    [techStacks]
  );

  const [initialSnapshot, setInitialSnapshot] = useState<string>("");

  // 프로젝트 이미지
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const imageMenuRef = useRef<HTMLDivElement>(null);

  const compressImage = (file: File, maxWidth = 800, quality = 0.85): Promise<File> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => resolve(new File([blob!], file.name, { type: "image/jpeg" })),
          "image/jpeg",
          quality,
        );
      };
      img.src = URL.createObjectURL(file);
    });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    setImageUploading(true);
    try {
      const compressed = await compressImage(file);
      const { data } = await uploadProjectImage(projectId, compressed);
      setImageUrl(data.data);
      toast.success("프로젝트 이미지가 변경되었습니다.");
    } catch {
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleImageDelete = async () => {
    if (!projectId) return;
    try {
      await deleteProjectImage(projectId);
      setImageUrl(null);
      toast.success("프로젝트 이미지가 삭제되었습니다.");
    } catch {
      toast.error("이미지 삭제에 실패했습니다.");
    }
  };

  // 이미지 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!showImageMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (imageMenuRef.current && !imageMenuRef.current.contains(e.target as Node)) {
        setShowImageMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showImageMenu]);

  // GET /edit → 폼 초기화 (팀장만 호출)
  useEffect(() => {
    if (!projectId || !isLeaderProp) return;
    setLoading(true);
    getProjectEditForm(projectId)
      .then(({ data: form }) => {
        const mappedStatus = BACKEND_TO_STATUS[form.status] ?? "active";
        setStatus(mappedStatus);
        setOriginalTitle(form.title ?? "");
        setName(form.teamName ?? form.title ?? "");
        setDescription(form.description ?? "");
        setDomain(form.domain ?? "");
        setImageUrl(form.imageUrl ?? null);
        setEditMembers(form.members.map(m => ({ userId: m.userId, role: m.role })));

        // skillIds → 이름 → 카테고리별 분류
        const skillNames = form.skillIds
          .map(id => SKILL_ID_TO_NAME[id])
          .filter(Boolean) as string[];
        setTechStacks(skillsToTechStacks(skillNames));

        // 초기 스냅샷 저장
        setInitialSnapshot(JSON.stringify({
          status: mappedStatus,
          name: form.teamName ?? form.title ?? "",
          description: form.description ?? "",
          domain: form.domain ?? "",
          techStacks: skillsToTechStacks(skillNames),
        }));
      })
      .catch((err) => {
        console.error("프로젝트 설정 로드 실패:", err);
        // 폴백: dashboard 데이터 사용
        if (info) {
          setName(info.teamName ?? info.title ?? "");
          setDescription(info.description ?? "");
          setDomain(info.domain ?? "");
          if (info.skills?.length) {
            setTechStacks(skillsToTechStacks(info.skills));
          }
        }
        setInitialSnapshot(JSON.stringify({
          status: "active",
          name: info?.teamName ?? info?.title ?? "",
          description: info?.description ?? "",
          domain: info?.domain ?? "",
          techStacks: skillsToTechStacks(info?.skills ?? []),
        }));
      })
      .finally(() => setLoading(false));
  }, [projectId, isLeaderProp]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasChanges = useMemo(() => {
    if (!initialSnapshot) return false;
    const current = JSON.stringify({ status, name, description, domain, techStacks });
    return current !== initialSnapshot;
  }, [status, name, description, domain, techStacks, initialSnapshot]);

  // 미저장 변경사항 있을 때 페이지 이탈 경고
  useEffect(() => {
    if (!hasChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const selectDomain = (d: string) =>
    setDomain((prev) => (prev === d ? "" : d));

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
        title: originalTitle,
        teamName: name,
        description,
        domain,
        skillIds,
        members: editMembers,
      });
      toast.success("프로젝트 설정이 저장되었습니다.");
      onSaved?.();
      // 스냅샷 갱신
      setInitialSnapshot(JSON.stringify({ status, name, description, domain, techStacks }));
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
    <div className="py-6 flex flex-col gap-5">
      {/* 페이지 타이틀 */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{isLeader ? "✏️" : "📋"}</span>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            프로젝트 설정
          </h1>
          {!isLeader && (
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: "var(--color-background)", color: "var(--color-text-tertiary)", border: "1px solid var(--color-border)" }}
            >
              읽기 전용
            </span>
          )}
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
          className="flex items-center gap-2 text-lg font-bold mb-5"
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
                onClick={() => isLeader && setStatus(opt.key)}
                disabled={!isLeader}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm font-medium transition-colors ${isLeader ? "cursor-pointer" : "cursor-default opacity-80"}`}
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
          className="flex items-center gap-2 text-lg font-bold mb-5"
          style={{ color: "var(--color-text-primary)" }}
        >
          📋 기본 정보
        </div>

        {/* 프로젝트 이미지 + 프로젝트명 */}
        <div className="mb-5">
          <div
            className="flex items-center gap-5 rounded-2xl p-4"
            style={{ background: "var(--color-background)" }}
          >
            {/* 프로젝트 이미지 */}
            <div className="flex flex-col items-center flex-shrink-0 relative" ref={imageMenuRef}>
              <button
                type="button"
                onClick={() => isLeader && setShowImageMenu((prev) => !prev)}
                className="relative w-[88px] h-[88px] rounded-2xl overflow-hidden flex items-center justify-center shadow-sm group"
                style={{
                  background: imageUrl ? "transparent" : "linear-gradient(135deg, var(--color-primary-soft), var(--color-surface))",
                  border: "2px solid var(--color-border)",
                  cursor: isLeader ? "pointer" : "default",
                }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="프로젝트 이미지" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1.5">
                    <Camera className="w-6 h-6" style={{ color: "var(--color-primary)", opacity: 0.5 }} />
                    <span className="text-[10px] font-medium" style={{ color: "var(--color-text-tertiary)" }}>대표 이미지</span>
                  </div>
                )}
                {isLeader && (
                  <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {imageUploading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                )}
              </button>
              {showImageMenu && (
                <div className="absolute left-[96px] top-2 bg-white border border-border rounded-xl shadow-lg py-1 z-10 w-28">
                  <button
                    type="button"
                    onClick={() => { imageInputRef.current?.click(); setShowImageMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-primary-soft transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {imageUrl ? "사진 변경" : "사진 추가"}
                  </button>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => { handleImageDelete(); setShowImageMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      사진 삭제
                    </button>
                  )}
                </div>
              )}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            {/* 프로젝트명 입력 */}
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <label
                className="text-sm font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                프로젝트명 <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                type="text"
                maxLength={50}
                value={name}
                onChange={(e) => isLeader && setName(e.target.value)}
                readOnly={!isLeader}
                placeholder="프로젝트명을 입력하세요"
                className={`w-full px-4 py-3 rounded-xl text-sm outline-none ${!isLeader ? "cursor-default" : ""}`}
                style={{
                  ...inputStyle(!!name),
                  background: "var(--color-surface)",
                }}
                onFocus={(e) => {
                  if (isLeader) e.currentTarget.style.borderColor = "var(--color-primary)";
                }}
                onBlur={(e) => {
                  if (!name)
                    e.currentTarget.style.borderColor = "var(--color-border)";
                }}
              />
            </div>
          </div>
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
            {isLeader && (
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
            )}
          </div>

          {descTab === "edit" && isLeader ? (
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
          {isLeader && (
          <p
            className="text-xs text-right mt-1"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {description.length} 자
          </p>
          )}
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
              const sel = domain === d;
              return (
                <button
                  key={d}
                  onClick={() => isLeader && selectDomain(d)}
                  disabled={!isLeader}
                  className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${isLeader ? "cursor-pointer" : "cursor-default"}`}
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
          className="flex items-center gap-2 text-lg font-bold mb-1"
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
                          onClick={() => isLeader && toggleStack(cat.key, stack)}
                          disabled={!isLeader}
                          className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${isLeader ? "cursor-pointer" : "cursor-default"}`}
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
                  {isLeader && (
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
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── 저장 버튼 (팀장만) ── */}
      {isLeader && (
      <button
        disabled={!hasChanges || saving}
        onClick={handleSave}
        className="w-full block py-3 rounded-xl text-base font-bold transition-colors"
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
      )}

      {/* ── 위험 영역 배너 (팀장만) ── */}
      {isLeader && (
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
          onClick={() => setShowDeleteModal(true)}
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
      )}

      {/* ── 팀 나가기 ── */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between"
        style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
      >
        <div>
          <p
            className="text-sm font-bold"
            style={{ color: "var(--color-error)" }}
          >
            팀 나가기
          </p>
        </div>
        <button
          onClick={() => setShowLeaveModal(true)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors cursor-pointer"
          style={{ background: "var(--color-error)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "#DC2626")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--color-error)")
          }
        >
          나가기
        </button>
      </div>

      </div>{/* 우측 컬럼 끝 */}
      </div>{/* 그리드 끝 */}

      {/* ── 팀 나가기 확인 모달 ── */}
      {showLeaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowLeaveModal(false)}
        >
          <div
            className="rounded-2xl px-12 py-10 flex flex-col items-center gap-4 w-[400px] shadow-xl"
            style={{ background: "var(--color-surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-4xl">🚪</span>
            <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>팀에서 나가시겠습니까?</p>
            <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
              나가면 다시 합류하려면 신청이 필요합니다.
            </p>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 py-3 rounded-2xl font-semibold text-base cursor-pointer"
                style={{ background: "var(--color-background)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (!projectId) return;
                  leaveProject(projectId)
                    .then(() => {
                      toast.success("팀에서 나갔습니다.");
                      setShowLeaveModal(false);
                      navigate("/my-projects");
                    })
                    .catch(() => toast.error("팀 나가기에 실패했습니다. 다시 시도해주세요."));
                }}
                className="flex-1 py-3 rounded-2xl text-white font-semibold text-base transition-colors cursor-pointer"
                style={{ background: "var(--color-error)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#DC2626")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-error)")}
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 프로젝트 삭제 확인 모달 ── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="rounded-2xl px-12 py-10 flex flex-col items-center gap-4 w-[400px] shadow-xl"
            style={{ background: "var(--color-surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-4xl">🗑️</span>
            <p className="text-lg font-bold" style={{ color: "var(--color-error)" }}>프로젝트를 삭제하시겠습니까?</p>
            <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
              삭제된 프로젝트는 복구할 수 없습니다.
            </p>
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-2xl font-semibold text-base cursor-pointer"
                style={{ background: "var(--color-background)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (!projectId) return;
                  deleteProject(projectId)
                    .then(() => {
                      toast.success("프로젝트가 삭제되었습니다.");
                      setShowDeleteModal(false);
                      navigate("/my-projects");
                    })
                    .catch(() => toast.error("프로젝트 삭제에 실패했습니다. 다시 시도해주세요."));
                }}
                className="flex-1 py-3 rounded-2xl text-white font-semibold text-base transition-colors cursor-pointer"
                style={{ background: "var(--color-error)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#DC2626")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-error)")}
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSettings;
