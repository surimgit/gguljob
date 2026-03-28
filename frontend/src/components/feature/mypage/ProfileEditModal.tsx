import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, Trash2, Check, Loader2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { BaseModal, TechStackInput } from '../../common';
import type { ProjectSimple } from '../../../types/project';
import { updateProfileApi, uploadProfileImageApi, deleteProfileImageApi } from '../../../api/user';
import type { ProfileUpdateRequest } from '../../../api/user';
import type { PositionType } from '../../../types/user';
import { ROLE_LIST, ROLE_DISPLAY_NAMES, ROLE_TO_API } from '../../../constants/skills';
import toast from 'react-hot-toast';

// ── 크롭 유틸 ─────────────────────────────────────────────────────────────────
const createCroppedImage = async (imageSrc: string, pixelCrop: Area): Promise<File> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => { image.onload = resolve; });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], 'profile.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  });
};


interface Project {
  id: string;
  name: string;
  description: string;
  domain?: string;
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageMenuRef = useRef<HTMLDivElement>(null);

  // 크롭 상태
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    const croppedFile = await createCroppedImage(cropImageSrc, croppedAreaPixels);
    setImageFile(croppedFile);
    setForm((prev) => ({ ...prev, avatarUrl: URL.createObjectURL(croppedFile) }));
    setCropImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  // 모달이 열릴 때마다 최신 데이터로 동기화
  useEffect(() => {
    if (isOpen) {
      setForm(initialData);
      setImageFile(null);
      setShowImageMenu(false);
    }
  }, [isOpen, initialData]);

  // 역할 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!roleDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [roleDropdownOpen]);

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

  const eligibleProjects = availableProjects;

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
        description: project.description ?? '',
        domain: project.domain ?? '',
        myRole: '',
        period: STATUS_MAP[project.status] ?? project.status,
        techStacks: project.skills ?? [],
      };
      setForm((prev) => ({ ...prev, projects: [...prev.projects, newProject] }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropImageSrc(url);
    e.target.value = '';
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
      const payload: ProfileUpdateRequest = {
        description: form.bio,
        roles: form.role ? [form.role as PositionType] : [],
        skills: form.techStacks,
        repProjectIds: form.projects.map((p) => Number(p.id)),
      };
      await updateProfileApi(payload);

      onSave(form);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: unknown } };
      console.error('[프로필 수정] 실패:', axiosErr.response?.status, axiosErr.response?.data);
      alert('프로필 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  if (showSuccessModal) {
    return (
      <BaseModal
        isOpen={true}
        onClose={() => { setShowSuccessModal(false); onClose(); }}
        containerClassName="bg-white rounded-2xl w-[360px] shadow-2xl overflow-hidden"
      >
        <div className="flex flex-col items-center px-8 py-8 gap-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-7 h-7 text-green-500" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-text-primary mb-1">저장 완료</p>
            <p className="text-sm text-text-secondary">프로필이 성공적으로 저장되었습니다.</p>
          </div>
          <button
            type="button"
            onClick={() => { setShowSuccessModal(false); onClose(); }}
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-text-primary text-sm font-semibold transition-colors"
          >
            확인
          </button>
        </div>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      containerClassName="bg-white rounded-3xl w-[720px] overflow-hidden shadow-2xl"
    >
      {/* 상단 바 */}
      <div className="h-11 bg-primary w-full relative flex items-center justify-between px-5">
        <span className="text-text-primary font-bold text-base">프로필 수정</span>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* 이미지 크롭 오버레이 */}
      {cropImageSrc && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-[400px] overflow-hidden">
            {/* 크롭 헤더 */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <span className="text-[15px] font-bold text-text-primary">프로필 사진 편집</span>
              <button
                type="button"
                onClick={handleCropCancel}
                className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* 크롭 영역 */}
            <div className="relative w-full h-[300px] bg-gray-900">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* 줌 컨트롤 + 버튼 */}
            <div className="px-6 py-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none bg-gray-200 accent-[#F2B705] cursor-pointer"
                />
                <span className="text-[11px] text-gray-400 font-medium w-8 text-right">{zoom.toFixed(1)}x</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCropCancel}
                  className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleCropConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-[#F2B705] hover:bg-[#e0a804] text-white text-sm font-bold transition-colors shadow-[0_2px_8px_rgba(242,183,5,0.3)]"
                >
                  적용하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <label className="text-xs font-medium text-text-secondary">이름 (GitHub 연동)</label>
                <input
                  type="text"
                  value={form.name}
                  readOnly
                  className="px-3 py-2 rounded-xl border border-border text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div className="flex flex-col gap-1" ref={roleDropdownRef}>
                <label className="text-xs font-medium text-text-secondary">희망 직무</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setRoleDropdownOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between pl-3 pr-3 py-2 rounded-xl border text-sm bg-white text-text-primary transition-colors ${roleDropdownOpen ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-gray-400'}`}
                  >
                    <span className={form.role ? 'text-text-primary' : 'text-text-tertiary'}>
                      {form.role ? ROLE_DISPLAY_NAMES[ROLE_LIST.find(c => ROLE_TO_API[c] === form.role) ?? ''] ?? form.role : '상관 없음'}
                    </span>
                    <svg className={`w-4 h-4 text-text-tertiary transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {roleDropdownOpen && (
                    <ul className="absolute z-20 mt-1 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden">
                      <li>
                        <button
                          type="button"
                          onClick={() => { setForm((prev) => ({ ...prev, role: null })); setRoleDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-primary-soft ${!form.role ? 'bg-primary-soft font-semibold text-text-primary' : 'text-text-secondary'}`}
                        >
                          상관 없음
                        </button>
                      </li>
                      {ROLE_LIST.map((code) => (
                        <li key={code}>
                          <button
                            type="button"
                            onClick={() => { setForm((prev) => ({ ...prev, role: ROLE_TO_API[code] })); setRoleDropdownOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-primary-soft ${form.role === ROLE_TO_API[code] ? 'bg-primary-soft font-semibold text-text-primary' : 'text-text-secondary'}`}
                          >
                            {ROLE_DISPLAY_NAMES[code]}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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
            <h3 className="text-base font-bold text-text-primary mb-3 pl-3">기술 스택</h3>
            <TechStackInput
              value={form.techStacks}
              onChange={(stacks) => setForm((prev) => ({ ...prev, techStacks: stacks }))}
            />
          </div>

          {/* 대표 프로젝트 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-text-primary pl-3">대표 프로젝트</h3>
              <span className="text-xs text-text-tertiary">{form.projects.length}/2 선택</span>
            </div>

            {/* 프로젝트 리스트박스 */}
            {eligibleProjects.length === 0 ? (
              <p className="text-sm text-text-tertiary py-4 text-center">
                참여 중인 프로젝트가 없습니다.
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
