/* ── 백엔드 DB에 등록된 스킬 목록 (skill 테이블 기준) ── */

export interface Skill {
  id: number;
  name: string;
  category: string;
}

export const SKILLS: Skill[] = [
  // FRONTEND
  { id: 1, name: "React", category: "FRONTEND" },
  { id: 2, name: "Vue.js", category: "FRONTEND" },
  { id: 19, name: "Next.js", category: "FRONTEND" },
  { id: 16, name: "JavaScript", category: "FRONTEND" },
  { id: 17, name: "TypeScript", category: "FRONTEND" },
  { id: 18, name: "HTML/CSS", category: "FRONTEND" },
  { id: 66, name: "Swift", category: "FRONTEND" },
  { id: 46, name: "jQuery", category: "FRONTEND" },
  { id: 47, name: "Ajax", category: "FRONTEND" },
  { id: 48, name: "Nexacro", category: "FRONTEND" },
  { id: 49, name: "WebSquare", category: "FRONTEND" },

  // BACKEND
  { id: 3, name: "Java", category: "BACKEND" },
  { id: 4, name: "Spring Boot", category: "BACKEND" },
  { id: 5, name: "Python", category: "BACKEND" },
  { id: 20, name: "Node.js", category: "BACKEND" },
  { id: 63, name: "Django", category: "BACKEND" },
  { id: 64, name: "Flask", category: "BACKEND" },
  { id: 45, name: "FastAPI", category: "BACKEND" },
  { id: 43, name: "JPA", category: "BACKEND" },
  { id: 44, name: "MyBatis", category: "BACKEND" },
  { id: 27, name: "Nest.js", category: "BACKEND" },
  { id: 28, name: "Kafka", category: "BACKEND" },
  { id: 26, name: ".NET", category: "BACKEND" },
  { id: 25, name: "PHP", category: "BACKEND" },
  { id: 13, name: "C", category: "BACKEND" },
  { id: 14, name: "C#", category: "BACKEND" },
  { id: 15, name: "C++", category: "BACKEND" },
  { id: 42, name: "JSP", category: "BACKEND" },
  { id: 53, name: "MFC/WPF", category: "BACKEND" },
  { id: 55, name: "전자정부프레임워크", category: "BACKEND" },
  { id: 59, name: "MSA", category: "BACKEND" },

  // DATABASE
  { id: 6, name: "MySQL", category: "DATABASE" },
  { id: 22, name: "PostgreSQL", category: "DATABASE" },
  { id: 23, name: "MariaDB", category: "DATABASE" },
  { id: 24, name: "MongoDB", category: "DATABASE" },
  { id: 21, name: "Oracle DB", category: "DATABASE" },
  { id: 41, name: "MSSQL", category: "DATABASE" },
  { id: 54, name: "RDBMS/DBMS", category: "DATABASE" },
  { id: 60, name: "Tibero", category: "DATABASE" },

  // DEVOPS
  { id: 8, name: "Docker", category: "DEVOPS" },
  { id: 9, name: "Kubernetes", category: "DEVOPS" },
  { id: 7, name: "AWS", category: "DEVOPS" },
  { id: 31, name: "GCP", category: "DEVOPS" },
  { id: 30, name: "Azure", category: "DEVOPS" },
  { id: 10, name: "Jenkins", category: "DEVOPS" },
  { id: 11, name: "Git", category: "DEVOPS" },
  { id: 12, name: "Redis", category: "DEVOPS" },
  { id: 65, name: "Nginx", category: "DEVOPS" },
  { id: 29, name: "Linux", category: "DEVOPS" },
  { id: 62, name: "Airflow", category: "DEVOPS" },
  { id: 58, name: "VMware", category: "DEVOPS" },
  { id: 68, name: "임베디드 Linux", category: "DEVOPS" },
  { id: 69, name: "Windows", category: "DEVOPS" },
  { id: 72, name: "ISMS", category: "DEVOPS" },

  // DATA
  { id: 37, name: "PyTorch", category: "DATA" },
  { id: 38, name: "TensorFlow", category: "DATA" },
  { id: 50, name: "OpenCV", category: "DATA" },
  { id: 51, name: "Hadoop", category: "DATA" },

  // AI
  { id: 70, name: "AI", category: "AI" },
  { id: 57, name: "LLM", category: "AI" },
  { id: 56, name: "RAG", category: "AI" },
  { id: 67, name: "MLOps", category: "AI" },

  // MOBILE
  { id: 32, name: "Android", category: "MOBILE" },
  { id: 33, name: "iOS", category: "MOBILE" },
  { id: 34, name: "Kotlin", category: "MOBILE" },
  { id: 35, name: "Flutter", category: "MOBILE" },
  { id: 36, name: "React Native", category: "MOBILE" },
  { id: 52, name: "Unity", category: "MOBILE" },

  // DESIGN
  { id: 40, name: "Figma", category: "DESIGN" },
  { id: 73, name: "Adobe XD", category: "DESIGN" },
  { id: 74, name: "Photoshop", category: "DESIGN" },
  { id: 75, name: "Illustrator", category: "DESIGN" },

  // PM
  { id: 61, name: "SAP", category: "PM" },
  { id: 71, name: "MES", category: "PM" },
  { id: 39, name: "Jira", category: "PM" },
];

/** 스킬 이름만 모아놓은 배열 */
export const SKILL_NAMES = SKILLS.map((s) => s.name);

/** 카테고리별 스킬 이름 */
export const SKILLS_BY_CATEGORY = SKILLS.reduce<Record<string, string[]>>((acc, s) => {
  (acc[s.category] ??= []).push(s.name);
  return acc;
}, {});

/** 스킬 이름 → id 매핑 */
export const SKILL_NAME_TO_ID = Object.fromEntries(SKILLS.map((s) => [s.name, s.id]));

/** 스킬 id → 이름 매핑 */
export const SKILL_ID_TO_NAME = Object.fromEntries(SKILLS.map((s) => [s.id, s.name]));

/* ── 직무(Role) 관련 상수 — DB skill 카테고리 기준 ── */

export type RoleCode =
  | "FRONTEND" | "BACKEND" | "DEVOPS" | "DATA"
  | "AI" | "DATABASE" | "MOBILE" | "PM" | "DESIGN";

/** 전체 직무 목록 */
export const ROLE_LIST: RoleCode[] = [
  "FRONTEND", "BACKEND", "DEVOPS", "DATA",
  "AI", "DATABASE", "MOBILE", "PM", "DESIGN",
];

/** 직무별 색상 */
export const ROLE_COLORS: Record<string, string> = {
  FRONTEND: "#2196F3",
  BACKEND:  "#22C55E",
  DEVOPS:   "#7C3AED",
  DATA:     "#14B8A6",
  AI:       "#EC4899",
  DATABASE: "#0EA5E9",
  MOBILE:   "#F97316",
  PM:       "#F59E0B",
  DESIGN:   "#8B5CF6",
};

/** 직무 코드 → 화면 표시 이름 (영어 풀네임) */
export const ROLE_DISPLAY_NAMES: Record<RoleCode, string> = {
  FRONTEND: "Frontend",
  BACKEND:  "Backend",
  DEVOPS:   "DevOps",
  DATA:     "Data",
  AI:       "AI",
  DATABASE: "Database",
  MOBILE:   "Mobile",
  PM:       "PM",
  DESIGN:   "Design",
};

/** 직무 코드 → 백엔드 API Role 값 매핑 */
export const ROLE_TO_API: Record<RoleCode, string> = {
  FRONTEND: "FE",
  BACKEND:  "BE",
  DEVOPS:   "INFRA",
  DATA:     "DATA",
  AI:       "AI",
  DATABASE: "DB",
  MOBILE:   "MOBILE",
  PM:       "PM",
  DESIGN:   "DESIGN",
};

/** 백엔드 API Role 값 → RoleCode 역매핑 */
export const API_TO_ROLE: Record<string, RoleCode> = {
  ...Object.fromEntries(
    Object.entries(ROLE_TO_API).map(([code, api]) => [api, code as RoleCode]),
  ),
  /* 하위호환: 기존 TOOLS/DB 값이 내려올 경우 대체 매핑 */
  DB: "DATABASE",
  TOOLS: "PM",
};

/** 화면 표시 이름 → RoleCode 역매핑 (예: "Frontend" → "FRONTEND") */
export const DISPLAY_TO_ROLE: Record<string, RoleCode> = Object.fromEntries(
  Object.entries(ROLE_DISPLAY_NAMES).map(([code, display]) => [display, code as RoleCode]),
);

export const getRoleColor = (role: string): string =>
  ROLE_COLORS[role] ?? ROLE_COLORS[API_TO_ROLE[role]] ?? ROLE_COLORS[DISPLAY_TO_ROLE[role]] ?? "#6B7280";

export const getRoleDisplayName = (role: string): string =>
  ROLE_DISPLAY_NAMES[role as RoleCode] ?? ROLE_DISPLAY_NAMES[API_TO_ROLE[role]] ?? ROLE_DISPLAY_NAMES[DISPLAY_TO_ROLE[role]] ?? role;

/* ── 경력 레벨(ExperienceLevel) 관련 상수 ── */

export type ExperienceLevelCode = "BEGINNER" | "JUNIOR" | "MID_LEVEL" | "SENIOR";

/** enum name → 화면 표시 (필터 등에서 사용) */
export const EXPERIENCE_LEVEL_DISPLAY: Record<ExperienceLevelCode, string> = {
  BEGINNER:  "입문",
  JUNIOR:    "초급",
  MID_LEVEL: "중급",
  SENIOR:    "고급",
};

/** 백엔드 description → 프론트 표시명 매핑 (API 응답이 description 문자열로 옴) */
const EXPERIENCE_DESC_TO_DISPLAY: Record<string, string> = {
  "초급":        "입문",
  "중급(주니어)": "초급",
  "중급(미들)":   "중급",
  "고급":        "고급",
};

export const EXPERIENCE_LEVEL_COLORS: Record<string, { color: string; bg: string }> = {
  "입문": { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  "초급": { color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  "중급": { color: "#F97316", bg: "rgba(249,115,22,0.12)" },
  "고급": { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
};

/** API 응답의 level 문자열을 화면 표시명으로 변환 */
export const getExperienceLevelDisplay = (level: string): string =>
  EXPERIENCE_DESC_TO_DISPLAY[level] ?? EXPERIENCE_LEVEL_DISPLAY[level as ExperienceLevelCode] ?? level;

export const getExperienceLevelStyle = (level: string) => {
  const display = getExperienceLevelDisplay(level);
  return EXPERIENCE_LEVEL_COLORS[display] ?? { color: "#6B7280", bg: "rgba(107,114,128,0.12)" };
};

/** 기술 스택 카테고리 메타 (아이콘 제외 — UI에서 매핑) */
export const SKILL_CATEGORY_META: { key: string; label: string }[] = [
  { key: "FRONTEND", label: "Frontend" },
  { key: "BACKEND",  label: "Backend" },
  { key: "DATABASE", label: "Database" },
  { key: "DEVOPS",   label: "DevOps" },
  { key: "DATA",     label: "Data" },
  { key: "AI",       label: "AI" },
  { key: "MOBILE",   label: "Mobile" },
  { key: "DESIGN",   label: "Design" },
  { key: "PM",       label: "PM" },
];

/** 직무별 추천 스킬 (해당 카테고리의 스킬 목록) */
export const ROLE_STACKS: Record<RoleCode, string[]> = {
  FRONTEND: SKILLS_BY_CATEGORY["FRONTEND"] ?? [],
  BACKEND:  SKILLS_BY_CATEGORY["BACKEND"] ?? [],
  DATABASE: SKILLS_BY_CATEGORY["DATABASE"] ?? [],
  DEVOPS:   SKILLS_BY_CATEGORY["DEVOPS"] ?? [],
  DATA:     SKILLS_BY_CATEGORY["DATA"] ?? [],
  AI:       SKILLS_BY_CATEGORY["AI"] ?? [],
  MOBILE:   SKILLS_BY_CATEGORY["MOBILE"] ?? [],
  PM:       SKILLS_BY_CATEGORY["PM"] ?? [],
  DESIGN:   SKILLS_BY_CATEGORY["DESIGN"] ?? [],
};
