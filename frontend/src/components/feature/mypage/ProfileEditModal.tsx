import { useState, useRef } from 'react';
import { X, Camera, Check } from 'lucide-react';
import { BaseModal } from '../../common';
import type { PositionType } from '../../../types/user';
import type { Project as UserProject } from '../../../types/project';

const POSITION_LABEL: Record<PositionType, string> = {
  FE: 'Frontend',
  BE: 'Backend',
  AI: 'AI',
  PM: 'PM',
  INFRA: 'Infra',
  DESIGN: 'Design',
};

const TECH_STACK_OPTIONS = [
  'React', 'Vue', 'Angular', 'Next.js', 'Nuxt.js',
  'TypeScript', 'JavaScript', 'Python', 'Java', 'Kotlin', 'Swift', 'Go', 'Rust',
  'Node.js', 'Spring', 'Django', 'FastAPI', 'Express',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Firebase',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
  'Git', 'Figma', 'TailwindCSS',
];

const PROJECT_BG_OPTIONS = ['amber', 'green', 'sky', 'purple'] as const;

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
};

interface Project {
  id: string;
  name: string;
  description: string;
  emoji: string;
  bgColor: 'amber' | 'green' | 'sky' | 'purple';
  myRole: string;
  period: string;
  techStacks: string[];
}

interface ProfileEditForm {
  name: string;
  role: PositionType | null;
  bio: string;
  avatarUrl?: string;
  techStacks: string[];
  projects: Project[];
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProfileEditForm) => void;
  initialData: ProfileEditForm;
  availableProjects: UserProject[];
}

const ProfileEditModal = ({ isOpen, onClose, onSave, initialData, availableProjects }: ProfileEditModalProps) => {
  const [form, setForm] = useState<ProfileEditForm>(initialData);
  const [stackInput, setStackInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestions = stackInput.trim()
    ? TECH_STACK_OPTIONS.filter(
        (s) => s.toLowerCase().includes(stackInput.toLowerCase()) && !form.techStacks.includes(s)
      )
    : [];

  const addStack = (stack: string) => {
    if (!form.techStacks.includes(stack)) {
      setForm((prev) => ({ ...prev, techStacks: [...prev.techStacks, stack] }));
    }
    setStackInput('');
    setShowSuggestions(false);
  };

  const removeStack = (stack: string) => {
    setForm((prev) => ({ ...prev, techStacks: prev.techStacks.filter((s) => s !== stack) }));
  };

  const eligibleProjects = availableProjects.filter(
    (p) => p.status === 'IN_PROGRESS' || p.status === 'COMPLETED'
  );

  const isSelected = (projectId: number) =>
    form.projects.some((p) => p.id === String(projectId));

  const toggleProject = (project: UserProject) => {
    if (isSelected(project.id)) {
      setForm((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== String(project.id)) }));
    } else if (form.projects.length < 2) {
      const newProject: Project = {
        id: String(project.id),
        name: project.title,
        description: project.description,
        emoji: '🚀',
        bgColor: PROJECT_BG_OPTIONS[form.projects.length % PROJECT_BG_OPTIONS.length],
        myRole: '',
        period: STATUS_LABEL[project.status] ?? project.status,
        techStacks: project.techStacks,
      };
      setForm((prev) => ({ ...prev, projects: [...prev.projects, newProject] }));
    }
  };

  const updateMyRole = (id: string, myRole: string) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, myRole } : p)),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, avatarUrl: url }));
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      containerClassName="bg-white rounded-3xl w-[720px] overflow-hidden shadow-2xl"
    >
      {/* 상단 amber 바 */}
      <div className="h-14 bg-primary w-full flex items-center justify-between px-6">
        <span className="text-text-primary font-bold text-base">프로필 수정</span>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* 기본 정보 영역 */}
        <div className="flex items-start gap-6 px-8 py-6">
          {/* 이미지 업로드 */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full bg-primary-soft flex items-center justify-center overflow-hidden group"
            >
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">🐝</span>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <span className="text-xs text-text-tertiary">사진 변경</span>
          </div>

          {/* 이름 / 역할 / 소개 */}
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-medium text-text-secondary">이름</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-secondary">역할</label>
                <select
                  value={form.role ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as PositionType || null }))}
                  className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">선택</option>
                  {(Object.keys(POSITION_LABEL) as PositionType[]).map((key) => (
                    <option key={key} value={key}>{POSITION_LABEL[key]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-secondary">소개</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                rows={2}
                className="px-3 py-2 rounded-xl border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="bg-background mx-4 mb-4 rounded-2xl p-6 flex flex-col gap-6">
          {/* 기술 스택 */}
          <div>
            <h3 className="text-base font-bold text-text-primary mb-3">🛠 기술 스택</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.techStacks.map((stack) => (
                <span
                  key={stack}
                  className="flex items-center gap-1 px-3 py-1 rounded-full border border-border bg-white text-sm text-text-primary"
                >
                  {stack}
                  <button type="button" onClick={() => removeStack(stack)}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={stackInput}
                onChange={(e) => { setStackInput(e.target.value); setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && stackInput.trim()) {
                    e.preventDefault();
                    addStack(stackInput.trim());
                  }
                }}
                placeholder="기술 스택 입력 후 Enter"
                className="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute top-full mt-1 w-full bg-white border border-border rounded-xl shadow-md z-10 max-h-40 overflow-y-auto">
                  {suggestions.map((s) => (
                    <li
                      key={s}
                      onMouseDown={() => addStack(s)}
                      className="px-4 py-2 text-sm text-text-primary hover:bg-primary-soft cursor-pointer"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 대표 프로젝트 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-text-primary">🚀 대표 프로젝트</h3>
              <span className="text-xs text-text-tertiary">{form.projects.length}/2 선택</span>
            </div>

            {/* 선택 가능한 프로젝트 목록 */}
            {eligibleProjects.length === 0 ? (
              <p className="text-sm text-text-tertiary py-4 text-center">
                진행 중이거나 완료한 프로젝트가 없습니다.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {eligibleProjects.map((project) => {
                  const selected = isSelected(project.id);
                  const disabled = !selected && form.projects.length >= 2;
                  return (
                    <button
                      key={project.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleProject(project)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
                        selected
                          ? 'border-primary bg-primary-soft'
                          : disabled
                          ? 'border-border bg-white opacity-40 cursor-not-allowed'
                          : 'border-border bg-white hover:border-primary hover:bg-primary-soft'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary">{project.title}</p>
                          <span className="text-xs text-text-tertiary flex-shrink-0">
                            {STATUS_LABEL[project.status]}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5 truncate">{project.description}</p>
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {project.techStacks.slice(0, 4).map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded-full bg-background text-xs text-text-secondary border border-border">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 transition-colors ${
                        selected ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {selected && <Check className="w-3 h-3 text-text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 선택된 프로젝트 역할 입력 */}
            {form.projects.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-xs font-medium text-text-secondary">나의 역할 입력</p>
                {form.projects.map((project) => (
                  <div key={project.id} className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-border">
                    <p className="text-sm font-medium text-text-primary flex-1 truncate">{project.name}</p>
                    <input
                      type="text"
                      value={project.myRole}
                      onChange={(e) => updateMyRole(project.id, e.target.value)}
                      placeholder="예: Frontend"
                      className="text-xs text-text-secondary px-2 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary w-36 flex-shrink-0"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-background transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-text-primary text-sm font-semibold transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ProfileEditModal;
