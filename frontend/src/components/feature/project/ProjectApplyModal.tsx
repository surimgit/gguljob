import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import BaseModal from '../../common/BaseModal';
import ProjectConfirmModal from './ProjectConfirmModal';
import type { ProjectCardDto, ProjectPositionDto } from '../../../types/project';
import { applyToPosition } from '../../../api/projects';
import { getCategoryColorPair } from '../../../constants/domains';

interface ProjectApplyModalProps {
  project: ProjectCardDto;
  onClose: () => void;
  onApplied?: () => void;
}



const STATUS_LABEL: Record<string, string> = {
  RECRUITING: '모집중',
  PROCEEDING: '진행중',
  DONE: '마감',
};

function PositionCard({
  label, color, position, selected, onSelect,
}: {
  label: string;
  color: string;
  position: ProjectPositionDto;
  selected: boolean;
  onSelect: () => void;
}) {
  const openSlots = position.targetCount - position.currentCount;
  const progress = position.targetCount > 0 ? position.currentCount / position.targetCount : 0;

  return (
    <div
      className={`rounded-[16px] border-2 p-[20px] cursor-pointer transition-all ${
        selected ? 'border-primary bg-[#FFFDF5]' : 'border-dashed border-[#e5e7eb] bg-white'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <span className="font-black text-[#111827] text-[16px]">{label}</span>
        <div className="flex items-center gap-[10px]">
          <span className="bg-primary-soft text-text-brown font-bold text-[13px] px-[12px] py-[4px] rounded-[8px]">
            {openSlots}명 모집
          </span>
          <div
            className={`w-[24px] h-[24px] rounded-full border-2 flex items-center justify-center transition-colors ${
              selected ? 'border-primary bg-primary' : 'border-[#d1d5db] bg-white'
            }`}
          >
            {selected && <div className="w-[10px] h-[10px] rounded-full bg-white" />}
          </div>
        </div>
      </div>

      <p className="text-[#9ca3af] text-[13px] font-bold mt-[6px]">
        {position.currentCount}/{position.targetCount}명 충원
      </p>

      <div className="mt-[10px] h-[6px] rounded-full bg-[#e5e7eb] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress * 100}%`,
            background: `linear-gradient(to right, ${color}, #F7C948)`,
          }}
        />
      </div>
    </div>
  );
}


const MAX_INTRO_LENGTH = 200;

const ProjectApplyModal = ({ project, onClose, onApplied }: ProjectApplyModalProps) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [intro, setIntro] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const catColor = getCategoryColorPair(project.domain);

  const openPositions = project.positions.filter((p) => p.currentCount < p.targetCount);
  const totalOpen = openPositions.reduce((sum, p) => sum + (p.targetCount - p.currentCount), 0);

  const handleApply = async () => {
    if (!selectedRole) return;
    const position = project.positions.find((p) => p.role === selectedRole);
    if (!position) return;

    setSubmitting(true);
    try {
      await applyToPosition(project.projectId, position.positionId, intro || undefined);
      onApplied?.();
      setShowConfirm(true);
    } catch {
      toast.error('지원에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen
      onClose={onClose}
      containerClassName="bg-white rounded-[24px] w-[520px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
    >
      {/* 상단 바 */}
      <div className="h-11 bg-primary w-full relative flex items-center justify-end px-5">
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* 본문 */}
      <div className="px-[32px] pt-[24px] pb-[32px] overflow-y-auto flex-1">

        {/* 카테고리 + 상태 */}
        <div className="flex items-center gap-[12px]">
          <span
            className="font-bold text-[13px] px-[10px] py-[3px] rounded-[6px]"
            style={{ backgroundColor: catColor.bg, color: catColor.text }}
          >
            {project.domain}
          </span>
          <div className="flex items-center gap-[5px]">
            <div className="w-[8px] h-[8px] rounded-full bg-[#22c55e]" />
            <span className="text-[#22c55e] font-bold text-[13px]">
              {STATUS_LABEL[project.status] ?? project.status}
            </span>
          </div>
        </div>

        {/* 제목 */}
        <h2 className="font-bold text-[#111827] text-xl mt-[12px]">{project.title}</h2>

        {/* 작성자 */}
        <div className="flex items-center gap-[10px] mt-[12px]">
          {project.leaderProfileImageUrl ? (
            <img
              src={project.leaderProfileImageUrl}
              alt={project.leaderName}
              className="w-[28px] h-[28px] rounded-full object-cover"
            />
          ) : (
            <div
              className="w-[28px] h-[28px] rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#6366f1' }}
            >
              <span className="text-white text-[12px] font-bold">{project.leaderName?.[0] ?? '?'}</span>
            </div>
          )}
          <span className="text-[#111827] text-base font-semibold">{project.leaderName}</span>
        </div>

        <hr className="border-[#f0ebe3] my-[24px]" />

        {/* 팀원 모집 */}
        <h3 className="font-extrabold text-[#111827] text-[16px] mb-[16px]">팀원 모집</h3>

        <div className="flex items-center justify-between bg-primary-soft rounded-[12px] px-[16px] py-[12px] mb-[16px]">
          <div className="flex items-center gap-[8px]">
            <span className="text-[18px]">📢</span>
            <span className="text-[14px] font-bold text-[#111827]">
              총 <span className="font-black text-primary-hover">{totalOpen}명</span> 모집중
            </span>
          </div>
          <span className="text-[13px] text-[#9ca3af] font-bold">
            {selectedRole ? '직무가 선택되었습니다' : '직무를 선택하세요'}
          </span>
        </div>

        {/* 포지션 카드 */}
        <div className="flex flex-col gap-[16px]">
          {openPositions.map((pos) => (
            <PositionCard
              key={pos.role}
              label={getRoleDisplayName(pos.role)}
              color={getRoleColor(pos.role)}
              position={pos}
              selected={selectedRole === pos.role}
              onSelect={() => setSelectedRole(pos.role)}
            />
          ))}
        </div>

        {/* 자기소개 */}
        <div className="mt-[20px]">
          <label className="block text-[16px] font-extrabold text-[#111827] mb-[8px]">
            자기소개
          </label>
          <textarea
            value={intro}
            onChange={(e) => {
              if (e.target.value.length <= MAX_INTRO_LENGTH) setIntro(e.target.value);
            }}
            placeholder="본인을 간략하게 소개해 주세요"
            rows={3}
            className="w-full rounded-[12px] border-2 border-[#e5e7eb] bg-white px-[16px] py-[12px] text-[13px] text-[#111827] placeholder:text-[#9ca3af] focus:border-primary focus:outline-none resize-none transition-colors"
          />
          <p className="text-[12px] text-[#9ca3af] text-right mt-[4px]">
            {intro.length}/{MAX_INTRO_LENGTH}
          </p>
        </div>

        {/* 지원 버튼 */}
        <button
          disabled={!selectedRole || submitting}
          onClick={handleApply}
          className={`w-full mt-[24px] py-[16px] rounded-[14px] font-black text-[15px] transition-all ${
            selectedRole && !submitting
              ? 'bg-primary text-[#111827] hover:bg-primary-hover shadow-[0px_4px_12px_0px_rgba(247,201,72,0.4)]'
              : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
          }`}
        >
          {submitting ? '지원 중...' : selectedRole ? '지원하기' : '직무를 선택해 주세요'}
        </button>
      </div>

      {showConfirm && (
        <ProjectConfirmModal
          title="지원 완료"
          subtitle="프로젝트에 지원이 완료되었습니다."
          confirmText="확인"
          onConfirm={() => {
            setShowConfirm(false);
            onClose();
          }}
          onClose={() => {
            setShowConfirm(false);
            onClose();
          }}
        />
      )}
    </BaseModal>
  );
};

export default ProjectApplyModal;
