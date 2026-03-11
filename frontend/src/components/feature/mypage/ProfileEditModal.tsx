import { useState, useRef } from 'react';
import { X, Plus, Trash2, Camera } from 'lucide-react';
import { BaseModal } from '../../common';
import type { PositionType } from '../../../types/user';

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
const PROJECT_BG: Record<string, string> = {
  amber: 'bg-amber-100',
  green: 'bg-green-100',
  sky: 'bg-sky-100',
  purple: 'bg-purple-100',
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
}

const ProfileEditModal = ({ isOpen, onClose, onSave, initialData }: ProfileEditModalProps) => {
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

  const addProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      emoji: '🚀',
      bgColor: PROJECT_BG_OPTIONS[form.projects.length % PROJECT_BG_OPTIONS.length],
      myRole: '',
      period: '',
      techStacks: [],
    };
    setForm((prev) => ({ ...prev, projects: [...prev.projects, newProject] }));
  };

  const removeProject = (id: string) => {
    setForm((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== id) }));
  };

  const updateProject = (id: string, field: keyof Project, value: string | string[]) => {
    setForm((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
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
              className="relative w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden group"
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
            <span className="text-xs text-gray-400">사진 변경</span>
          </div>

          {/* 이름 / 역할 / 소개 */}
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs font-medium text-gray-500">이름</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">역할</label>
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
              <label className="text-xs font-medium text-gray-500">소개</label>
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
        <div className="bg-stone-100 mx-4 mb-4 rounded-2xl p-6 flex flex-col gap-6">
          {/* 기술 스택 */}
          <div>
            <h3 className="text-base font-bold text-gray-800 mb-3">🛠 기술 스택</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.techStacks.map((stack) => (
                <span
                  key={stack}
                  className="flex items-center gap-1 px-3 py-1 rounded-full border border-border bg-white text-sm text-gray-700"
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
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 cursor-pointer"
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
              <h3 className="text-base font-bold text-gray-800">🚀 대표 프로젝트</h3>
              <button
                type="button"
                onClick={addProject}
                className="flex items-center gap-1 text-sm text-primary font-medium hover:text-amber-600"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {form.projects.map((project) => (
                <div key={project.id} className="bg-white rounded-2xl overflow-hidden">
                  <div className={`p-4 flex flex-col gap-2 ${PROJECT_BG[project.bgColor]}`}>
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={project.emoji}
                        onChange={(e) => updateProject(project.id, 'emoji', e.target.value)}
                        className="w-10 text-2xl bg-transparent focus:outline-none"
                        maxLength={2}
                      />
                      <button
                        type="button"
                        onClick={() => removeProject(project.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={project.name}
                      onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                      placeholder="프로젝트명"
                      className="text-base font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={project.description}
                      onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                      placeholder="한 줄 설명"
                      className="text-xs text-gray-600 bg-transparent border-b border-gray-300 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="px-4 py-3 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={project.myRole}
                        onChange={(e) => updateProject(project.id, 'myRole', e.target.value)}
                        placeholder="역할 (예: Frontend)"
                        className="flex-1 text-xs text-gray-600 px-2 py-1 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <input
                        type="text"
                        value={project.period}
                        onChange={(e) => updateProject(project.id, 'period', e.target.value)}
                        placeholder="기간 (예: 2025.01 - 진행중)"
                        className="flex-1 text-xs text-gray-600 px-2 py-1 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <input
                      type="text"
                      value={project.techStacks.join(', ')}
                      onChange={(e) =>
                        updateProject(
                          project.id,
                          'techStacks',
                          e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      placeholder="기술 스택 (쉼표로 구분)"
                      className="text-xs text-gray-600 px-2 py-1 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
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
