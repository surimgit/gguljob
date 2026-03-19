import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Info,
  ChevronDown,
  ChevronUp,
  Monitor,
  Server,
  Database,
  Cloud,
  Bot,
  Smartphone,
  FileText,
  Sparkles,
  X,
} from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';

/* ── 상수 ── */

const DOMAINS = [
  '웹기술', '웹디자인', '모바일', 'AIoT', '인공지능',
  '빅데이터', '블록체인', '자율주행', '콘텐츠',
];

const TECH_CATEGORIES = {
  Frontend:  { icon: Monitor,    stacks: ['React', 'Vue', 'Angular', 'Next.js', 'Nuxt.js', 'TypeScript', 'JavaScript', 'TailwindCSS', 'Svelte'] },
  Backend:   { icon: Server,     stacks: ['Spring', 'Django', 'FastAPI', 'Express', 'NestJS', 'Node.js', 'Java', 'Python', 'Go', 'Rust', 'Kotlin'] },
  Database:  { icon: Database,   stacks: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase', 'Oracle', 'SQLite'] },
  Infra:     { icon: Cloud,      stacks: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Jenkins', 'Nginx', 'Linux'] },
  AI:        { icon: Bot,        stacks: ['PyTorch', 'TensorFlow', 'Scikit-learn', 'Pandas', 'NumPy', 'OpenCV', 'HuggingFace'] },
  Mobile:    { icon: Smartphone, stacks: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Android', 'iOS'] },
} as const;

type TechCategory = keyof typeof TECH_CATEGORIES;

const POSITIONS = [
  { label: 'Frontend', value: 'FE' },
  { label: 'Backend', value: 'BE' },
  { label: 'AI', value: 'AI' },
  { label: 'PM', value: 'PM' },
  { label: 'Infra', value: 'INFRA' },
  { label: 'Design', value: 'DESIGN' },
];

/* ── 타입 ── */

interface Member {
  name: string;
  position: string;
  email: string;
}

interface ProjectFormState {
  name: string;
  description: string;
  domains: string[];
  gitUrl: string;
  techStacks: Record<string, string[]>;
  pdfFile: File | null;
  members: Member[];
}

/* ── 컴포넌트 ── */

const CreateProject = () => {
  const navigate = useNavigate();
  const { createProject } = useProjectStore();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ProjectFormState>({
    name: '',
    description: '',
    domains: [],
    gitUrl: '',
    techStacks: {},
    pdfFile: null,
    members: [],
  });

  const [openCategory, setOpenCategory] = useState<TechCategory | null>(null);
  const [memberDraft, setMemberDraft] = useState<Member>({ name: '', position: '', email: '' });

  /* ── 핸들러 ── */

  const toggleDomain = (d: string) =>
    setForm((prev) => ({
      ...prev,
      domains: prev.domains.includes(d)
        ? prev.domains.filter((v) => v !== d)
        : [...prev.domains, d],
    }));

  const toggleStack = (category: string, stack: string) =>
    setForm((prev) => {
      const cur = prev.techStacks[category] ?? [];
      return {
        ...prev,
        techStacks: {
          ...prev.techStacks,
          [category]: cur.includes(stack) ? cur.filter((s) => s !== stack) : [...cur, stack],
        },
      };
    });

  const canAddMember = memberDraft.name.trim() && memberDraft.position && memberDraft.email.trim();

  const addMember = () => {
    if (!canAddMember) return;
    setForm((prev) => ({ ...prev, members: [...prev.members, memberDraft] }));
    setMemberDraft({ name: '', position: '', email: '' });
  };

  const removeMember = (idx: number) =>
    setForm((prev) => ({ ...prev, members: prev.members.filter((_, i) => i !== idx) }));

  const canSubmit = form.name.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const projectId = await createProject({
        title: form.name,
        domain: form.domains[0],
        description: form.description,
        leaderRole: form.members[0]?.position || 'FE',
      });
      navigate(`/my-projects/${projectId}`);
    } catch {
      alert('프로젝트 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── JSX ── */

  return (
    <div style={{ backgroundColor: 'var(--color-background)' }} className="min-h-screen pb-24 sm:pb-28">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-6 sm:py-10 flex flex-col gap-4 sm:gap-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            새 프로젝트 생성
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            프로젝트 정보를 입력하고 팀원을 모집하세요
          </p>
        </div>

        {/* ─── 섹션 1: 기본 정보 ─── */}
        <section className="rounded-2xl p-4 sm:p-6 shadow-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="flex items-center gap-2 text-base font-bold mb-4 sm:mb-5" style={{ color: 'var(--color-text-primary)' }}>
            📋 기본 정보
          </h2>

          {/* 프로젝트명 */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--color-text-primary)' }}>
              프로젝트명 <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              type="text"
              maxLength={90}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="프로젝트 이름을 입력하세요"
              className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
            <p className="text-xs text-right mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {form.name.length}/90
            </p>
          </div>

          {/* 프로젝트 설명 */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--color-text-primary)' }}>
              프로젝트 설명
            </label>
            <textarea
              maxLength={500}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="프로젝트에 대해 간단히 설명해주세요"
              className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none h-28 resize-none transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
            <p className="text-xs text-right mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {form.description.length}/500
            </p>
          </div>

          {/* 도메인 선택 */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--color-text-primary)' }}>
              도메인
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DOMAINS.map((d) => {
                const selected = form.domains.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDomain(d)}
                    className="px-4 py-1.5 rounded-full border text-sm font-medium cursor-pointer transition-colors"
                    style={{
                      borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
                      color: selected ? 'var(--color-primary-hover)' : 'var(--color-text-secondary)',
                      backgroundColor: selected ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Git 저장소 URL */}
          <div>
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--color-text-primary)' }}>
              Git 저장소 URL
            </label>
            <input
              type="url"
              value={form.gitUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, gitUrl: e.target.value }))}
              placeholder="https://github.com/your-org/your-repo"
              className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
            <div
              className="flex items-center gap-2 mt-2 px-4 py-2.5 rounded-xl text-xs"
              style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary-hover)' }}
            >
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              연동 시 커밋·기록 기반 트러블슈팅 자동 매핑이 활성화돼요
            </div>
          </div>
        </section>

        {/* ─── 섹션 2: 기술 스택 ─── */}
        <section className="rounded-2xl p-4 sm:p-6 shadow-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="flex items-center gap-2 text-base font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            🛠 기술 스택
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
            프로젝트에서 사용할 기술을 선택하세요
          </p>

          <div className="flex flex-col gap-2">
            {(Object.keys(TECH_CATEGORIES) as TechCategory[]).map((cat) => {
              const { icon: Icon, stacks } = TECH_CATEGORIES[cat];
              const isOpen = openCategory === cat;
              const selectedStacks = form.techStacks[cat] ?? [];

              return (
                <div key={cat}>
                  <button
                    type="button"
                    onClick={() => setOpenCategory(isOpen ? null : cat)}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isOpen ? 'var(--color-primary-soft)' : 'var(--color-background)',
                      border: isOpen ? '1px solid var(--color-primary)' : '1px solid transparent',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Icon className="w-4 h-4" />
                      {cat}
                      {selectedStacks.length > 0 && (
                        <span
                          className="text-xs font-normal px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary-hover)' }}
                        >
                          {selectedStacks.length}
                        </span>
                      )}
                    </span>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                      : <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                    }
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 flex flex-wrap gap-2">
                      {stacks.map((stack) => {
                        const selected = selectedStacks.includes(stack);
                        return (
                          <button
                            key={stack}
                            type="button"
                            onClick={() => toggleStack(cat, stack)}
                            className="px-3 py-1 rounded-full border text-xs font-medium cursor-pointer transition-colors"
                            style={{
                              borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
                              backgroundColor: selected ? 'var(--color-primary-soft)' : 'transparent',
                              color: selected ? 'var(--color-primary-hover)' : 'var(--color-text-secondary)',
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
        </section>

        {/* ─── 섹션 3: AI 역할별 인원 분석 ─── */}
        <section
          className="rounded-2xl p-4 sm:p-6 shadow-sm"
          style={{ backgroundColor: '#EDE9FE', border: '1px solid #C4B5FD' }}
        >
          <h2 className="flex items-center gap-2 text-base font-bold mb-1" style={{ color: '#7C3AED' }}>
            🤖 AI 역할별 인원 분석
          </h2>
          <p className="text-xs mb-3" style={{ color: '#7C3AED' }}>
            기획서를 업로드하면 AI가 필요한 역할과 인원을 분석해드려요
          </p>

          {/* PDF 업로드 */}
          <label
            className="border-2 border-dashed rounded-xl p-5 sm:p-8 flex flex-col items-center gap-2 cursor-pointer"
            style={{ borderColor: '#C4B5FD', backgroundColor: 'var(--color-surface)' }}
          >
            <FileText className="w-10 h-10" style={{ color: 'var(--color-text-tertiary)' }} />
            <span className="text-sm font-semibold" style={{ color: '#7C3AED' }}>
              {form.pdfFile ? form.pdfFile.name : '기획서 PDF를 업로드하세요'}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              PDF 파일만 지원 (최대 10MB)
            </span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setForm((prev) => ({ ...prev, pdfFile: file }));
              }}
            />
          </label>

          {/* AI 분석 버튼 */}
          <button
            type="button"
            disabled={!form.pdfFile}
            className="w-full py-3 rounded-xl text-sm font-semibold mt-3 transition-colors flex items-center justify-center gap-2"
            style={{
              backgroundColor: form.pdfFile ? '#7C3AED' : 'var(--color-border)',
              color: form.pdfFile ? 'white' : 'var(--color-text-tertiary)',
              cursor: form.pdfFile ? 'pointer' : 'not-allowed',
            }}
          >
            <Sparkles className="w-4 h-4" />
            AI 분석하기
          </button>
        </section>

        {/* ─── 섹션 4: 팀원 등록 ─── */}
        <section className="rounded-2xl p-4 sm:p-6 shadow-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="flex items-center gap-2 text-base font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            👥 팀원 등록
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
            함께할 팀원을 등록하세요
          </p>

          {/* 입력 폼 */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={memberDraft.name}
                onChange={(e) => setMemberDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="이름"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
              />
              <select
                value={memberDraft.position}
                onChange={(e) => setMemberDraft((prev) => ({ ...prev, position: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: memberDraft.position ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
              >
                <option value="">포지션 선택</option>
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <input
              type="email"
              value={memberDraft.email}
              onChange={(e) => setMemberDraft((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="이메일"
              className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none mt-3 transition-colors"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />

            <button
              type="button"
              onClick={addMember}
              disabled={!canAddMember}
              className="w-full py-2.5 rounded-lg border text-sm font-medium mt-3 transition-colors"
              style={{
                backgroundColor: canAddMember ? 'var(--color-primary-soft)' : 'var(--color-border)',
                color: canAddMember ? 'var(--color-primary-hover)' : 'var(--color-text-tertiary)',
                borderColor: canAddMember ? 'var(--color-primary)' : 'var(--color-border)',
                cursor: canAddMember ? 'pointer' : 'not-allowed',
              }}
            >
              + 팀원 추가
            </button>
          </div>

          {/* 팀원 목록 */}
          {form.members.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <span className="text-3xl">👋</span>
              <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                아직 등록된 팀원이 없어요
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-4">
              {form.members.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ backgroundColor: 'var(--color-background)' }}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {m.name}
                      <span
                        className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary-hover)' }}
                      >
                        {m.position}
                      </span>
                    </span>
                    <span className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{m.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(idx)}
                    className="p-1 rounded-full transition-colors"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ─── 하단 고정 CTA ─── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-3 sm:px-4 pb-4 sm:pb-6 pt-3"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full max-w-[1400px] mx-auto block py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-bold transition-colors"
          style={{
            backgroundColor: canSubmit ? 'var(--color-primary)' : 'var(--color-border)',
            color: canSubmit ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? '생성 중...' : '프로젝트 생성하기'}
        </button>
      </div>
    </div>
  );
};

export default CreateProject;
