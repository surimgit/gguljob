import { useState, useRef, useEffect } from 'react';
import { X, Camera, Trash2, Check, Loader2 } from 'lucide-react';
import { BaseModal, TechStackInput } from '../../common';
import type { ProjectSimple } from '../../../types/project';
import { updateProfileApi, uploadProfileImageApi, deleteProfileImageApi } from '../../../api/user';
import type { ProfileUpdateRequest } from '../../../api/user';
import { ROLE_LIST, ROLE_DISPLAY_NAMES, ROLE_TO_API } from '../../../constants/skills';
import toast from 'react-hot-toast';


const PROJECT_BG_OPTIONS = ['amber', 'green', 'sky', 'purple'] as const;


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
  role: string | null;
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
  availableProjects: ProjectSimple[];
}

const ProfileEditModal = ({ isOpen, onClose, onSave, initialData, availableProjects }: ProfileEditModalProps) => {
  const [form, setForm] = useState<ProfileEditForm>(initialData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageMenuRef = useRef<HTMLDivElement>(null);

  // 모달이 열릴 때마다 최신 데이터로 동기화
  useEffect(() => {
    if (isOpen) {
      setForm(initialData);
      setImageFile(null);
      setShowImageMenu(false);
    }
  }, [isOpen, initialData]);

  // 이미지 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!showImageMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (imageMenuRef.current && !imageMenuRef.current.contains(e.target as Node)) {
        setShowImageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showImageMenu]);

  const eligibleProjects = availableProjects.filter(
    (p) => p.status === 'PROCEEDING' || p.status === 'DONE'
  );

  const isSelected = (projectId: number) =>
    form.projects.some((p) => p.id === String(projectId));

  const STATUS_MAP: Record<string, string> = {
    RECRUITING: '모집중',
    PROCEEDING: '진행중',
    DONE: '완료',
  };

  const removeProject = (id: string) => {
    setForm((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== id) }));
  };

  const toggleProject = (project: ProjectSimple) => {
    if (isSelected(project.projectId)) {
      removeProject(String(project.projectId));
    } else if (form.projects.length < 2) {
      const newProject: Project = {
        id: String(project.projectId),
        name: project.title,
        description: project.domain ?? '',
        emoji: '🚀',
        bgColor: PROJECT_BG_OPTIONS[form.projects.length % PROJECT_BG_OPTIONS.length],
        myRole: '',
        period: STATUS_MAP[project.status] ?? project.status,
        techStacks: project.skills ?? [],
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
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, avatarUrl: url }));
  };

  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const handleImageDelete = async () => {
    setIsDeletingImage(true);
    try {
      await deleteProfileImageApi();
      setImageFile(null);
      setForm((prev) => ({ ...prev, avatarUrl: undefined }));
      toast.success('프로필 이미지가 삭제되었습니다.');
    } catch {
      toast.error('이미지 삭제에 실패했습니다.');
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 이미지 업로드
      if (imageFile) {
        const res = await uploadProfileImageApi(imageFile);
        const imageUrl = res.data.data;
        setForm((prev) => ({ ...prev, avatarUrl: imageUrl }));
      }

      // 프로필 정보 수정
      if (!form.role) {
        alert('역할을 선택해주세요.');
        return;
      }
      const payload: ProfileUpdateRequest = {
        description: form.bio,
        roles: [form.role],
        skills: form.techStacks,
      };
      await updateProfileApi(payload);

      onSave(form);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: unknown } };
      console.error('[프로필 수정] 실패:', axiosErr.response?.status, axiosErr.response?.data);
      alert('프로필 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
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
        <div className="flex items-center gap-6 px-8 py-6">
          {/* 이미지 업로드 — 오른쪽 입력 영역 높이에 맞춤 */}
          <div className="flex flex-col items-center flex-shrink-0 relative" ref={imageMenuRef}>
            <button
              type="button"
              onClick={() => setShowImageMenu((prev) => !prev)}
              className="relative w-[112px] h-[112px] rounded-full bg-primary-soft flex items-center justify-center overflow-hidden group"
            >
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">🐝</span>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            {showImageMenu && (
              <div className="absolute left-[120px] top-6 bg-white border border-border rounded-xl shadow-lg py-1 z-10 w-28">
                <button
                  type="button"
                  onClick={() => { fileInputRef.current?.click(); setShowImageMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text-primary hover:bg-primary-soft transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  사진 변경
                </button>
                {form.avatarUrl && (
                  <button
                    type="button"
                    disabled={isDeletingImage}
                    onClick={() => { handleImageDelete(); setShowImageMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeletingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    {isDeletingImage ? '삭제 중...' : '사진 삭제'}
                  </button>
                )}
              </div>
            )}
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
                <label className="text-xs font-medium text-text-secondary">희망 직무</label>
                <select
                  value={form.role ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value || null }))}
                  className="px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">선택</option>
                  {ROLE_LIST.map((code) => (
                    <option key={code} value={ROLE_TO_API[code]}>{ROLE_DISPLAY_NAMES[code]}</option>
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
            <TechStackInput
              value={form.techStacks}
              onChange={(stacks) => setForm((prev) => ({ ...prev, techStacks: stacks }))}
            />
          </div>

          {/* 대표 프로젝트 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-text-primary">🚀 대표 프로젝트</h3>
              <span className="text-xs text-text-tertiary">{form.projects.length}/2 선택</span>
            </div>

            {/* 선택된 프로젝트 태그 */}
            {form.projects.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.projects.map((project) => (
                  <span
                    key={project.id}
                    className="flex items-center gap-1 px-3 py-1 rounded-full border border-primary bg-primary-soft text-sm text-text-primary"
                  >
                    {project.name}
                    <button type="button" onClick={() => removeProject(project.id)}>
                      <X className="w-3 h-3 text-text-secondary hover:text-text-primary" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 프로젝트 리스트박스 */}
            {eligibleProjects.length === 0 ? (
              <p className="text-sm text-text-tertiary py-4 text-center">
                진행 중이거나 완료한 프로젝트가 없습니다.
              </p>
            ) : (
              <ul className="border border-border rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto">
                {eligibleProjects.map((project) => {
                  const selected = isSelected(project.projectId);
                  const disabled = !selected && form.projects.length >= 2;
                  return (
                    <li key={project.projectId} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleProject(project)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                          selected
                            ? 'bg-primary-soft'
                            : disabled
                            ? 'opacity-40 cursor-not-allowed bg-white'
                            : 'bg-white hover:bg-primary-soft'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{project.title}</p>
                          <p className="text-xs text-text-tertiary">{STATUS_MAP[project.status] ?? project.status}</p>
                        </div>
                        {selected && <Check className="w-4 h-4 text-text-brown flex-shrink-0 ml-3" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
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
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-text-primary text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ProfileEditModal;
