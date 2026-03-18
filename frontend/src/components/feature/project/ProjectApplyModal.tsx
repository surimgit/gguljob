import { useState } from 'react';
import BaseModal from '../../common/BaseModal';
import ProjectConfirmModal from './ProjectConfirmModal';
import type { Project } from './ProjectCard';
import { X } from 'lucide-react';
import { applyToPosition } from '../../../api/projects';

interface ProjectApplyModalProps {
  project: Project;
  onClose: () => void;
  onApply?: (project: Project, position: 'fe' | 'be', intro: string) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  웹기술:   { bg: '#E3F2FD', text: '#2196F3' },
  웹디자인: { bg: '#FCE4EC', text: '#E91E63' },
  모바일:   { bg: '#FFF3E0', text: '#F57C00' },
  AIoT:    { bg: '#E0F2F1', text: '#00897B' },
  인공지능: { bg: '#EDE7F6', text: '#5E35B1' },
  빅데이터: { bg: '#F3E5F5', text: '#8E24AA' },
  블록체인: { bg: '#FFFDE7', text: '#F9A825' },
  자율주행: { bg: '#E0F7FA', text: '#0097A7' },
  핀테크:   { bg: '#E8F5E9', text: '#2E7D32' },
  메타버스: { bg: '#F3E5F5', text: '#AB47BC' },
};

const DEFAULT_CATEGORY_COLOR = { bg: '#F5F5F5', text: '#757575' };

function PositionCard({
  label, color, slots, selected, onSelect, requirements,
}: {
  label: string;
  color: string;
  slots: { current: number; total: number };
  selected: boolean;
  onSelect: () => void;
  requirements: string;
}) {
  const openSlots = slots.total - slots.current;
  const progress = slots.total > 0 ? slots.current / slots.total : 0;

  return (
    <div
      className={`rounded-[16px] border-2 p-[20px] cursor-pointer transition-all ${
        selected ? 'border-primary bg-[#FFFDF5]' : 'border-dashed border-[#e5e7eb] bg-white'
      }`}
      onClick={onSelect}
    >
      {/* 상단: 포지션명 + 모집 뱃지 + 라디오 */}
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

      {/* 충원 현황 */}
      <p className="text-[#9ca3af] text-[13px] font-bold mt-[6px]">
        {slots.current}/{slots.total}명 충원
      </p>

      {/* 프로그레스 바 */}
      <div className="mt-[10px] h-[6px] rounded-full bg-[#e5e7eb] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress * 100}%`,
            background: `linear-gradient(to right, ${color}, #F7C948)`,
          }}
        />
      </div>

      {/* 요구 스택 */}
      <div className="mt-[16px] bg-[#f7f8fa] rounded-[12px] px-[16px] py-[14px]">
        <p className="text-[12px] text-[#9ca3af] font-bold mb-[4px]">✂ 요구 스택/기술</p>
        <p className="text-[13px] text-[#6b7280] font-bold">{requirements}</p>
      </div>
    </div>
  );
}

const MAX_INTRO_LENGTH = 200;

const ProjectApplyModal = ({ project, onClose, onApply }: ProjectApplyModalProps) => {
  const [selectedPosition, setSelectedPosition] = useState<'fe' | 'be' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [intro, setIntro] = useState('');

  const catColor = CATEGORY_COLORS[project.category] ?? DEFAULT_CATEGORY_COLOR;
  const avatarColor = project.author.avatarColor ?? '#43b581';

  const feOpen = project.slots.fe.total - project.slots.fe.current;
  const beOpen = project.slots.be.total - project.slots.be.current;
  const totalOpen = feOpen + beOpen;

  return (
    <BaseModal
      isOpen
      onClose={onClose}
      containerClassName="bg-white rounded-[24px] w-[520px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
    >
      {/* 상단 그라디언트 바 + 닫기 버튼 */}
      <div
        className="relative h-[48px] rounded-t-[24px] flex items-center justify-end px-[16px]"
        style={{ background: 'linear-gradient(150.6deg, #F7C948 0%, #F2B705 100%)' }}
      >
        <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* 본문 - 스크롤 영역 */}
      <div className="px-[32px] pt-[24px] pb-[32px] overflow-y-auto flex-1">

        {/* 카테고리 + 상태 */}
        <div className="flex items-center gap-[12px]">
          <span
            className="font-bold text-[13px] px-[10px] py-[3px] rounded-[6px]"
            style={{ backgroundColor: catColor.bg, color: catColor.text }}
          >
            {project.category}
          </span>
          <div className="flex items-center gap-[5px]">
            <div className="w-[8px] h-[8px] rounded-full bg-[#22c55e]" />
            <span className="text-[#22c55e] font-bold text-[13px]">{project.status}</span>
          </div>
        </div>

        {/* 제목 */}
        <h2 className="font-black text-[#111827] text-[22px] mt-[12px]">{project.title}</h2>

        {/* 작성자 */}
        <div className="flex items-center gap-[10px] mt-[12px]">
          <div
            className="w-[28px] h-[28px] rounded-full flex items-center justify-center"
            style={{ backgroundColor: avatarColor }}
          >
            <span className="text-white text-[12px] font-bold">{project.author.initial}</span>
          </div>
          <span className="text-[#111827] text-[14px] font-bold">{project.author.name}</span>
          <span className="text-[#9ca3af] text-[13px]">2026-02-15</span>
        </div>

        <hr className="border-[#f0ebe3] my-[24px]" />

        {/* 팀원 모집 */}
        <h3 className="font-black text-[#111827] text-[16px] mb-[16px]">팀원 모집</h3>

        {/* 모집 요약 바 */}
        <div className="flex items-center justify-between bg-primary-soft rounded-[12px] px-[16px] py-[12px] mb-[16px]">
          <div className="flex items-center gap-[8px]">
            <span className="text-[18px]">📢</span>
            <span className="text-[14px] font-bold text-[#111827]">
              총 <span className="font-black text-primary-hover">{totalOpen}명</span> 모집중
            </span>
          </div>
          <span className="text-[13px] text-[#9ca3af] font-bold">
            {selectedPosition ? '직무가 선택되었습니다' : '직무를 선택하세요'}
          </span>
        </div>

        {/* 포지션 카드 */}
        <div className="flex flex-col gap-[16px]">
          {feOpen > 0 && (
            <PositionCard
              label="프론트엔드"
              color="#F97316"
              slots={project.slots.fe}
              selected={selectedPosition === 'fe'}
              onSelect={() => setSelectedPosition('fe')}
              requirements="React 경험자, 반응형 웹 구현 가능자"
            />
          )}
          {beOpen > 0 && (
            <PositionCard
              label="백엔드"
              color="#F97316"
              slots={project.slots.be}
              selected={selectedPosition === 'be'}
              onSelect={() => setSelectedPosition('be')}
              requirements="Spring Boot 경험자, REST API 설계 경험"
            />
          )}
        </div>

        {/* 자기소개 */}
        <div className="mt-[20px]">
          <label className="block text-[14px] font-black text-[#111827] mb-[8px]">
            자기소개
          </label>
          <textarea
            value={intro}
            onChange={(e) => {
              if (e.target.value.length <= MAX_INTRO_LENGTH) {
                setIntro(e.target.value);
              }
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
          disabled={!selectedPosition}
          onClick={() => selectedPosition && setShowConfirm(true)}
          className={`w-full mt-[24px] py-[16px] rounded-[14px] font-black text-[15px] transition-all ${
            selectedPosition
              ? 'bg-primary text-[#111827] hover:bg-primary-hover shadow-[0px_4px_12px_0px_rgba(247,201,72,0.4)]'
              : 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
          }`}
        >
          {selectedPosition ? '지원하기' : '직무를 선택해 주세요'}
        </button>

      </div>

      {showConfirm && selectedPosition && (
        <ProjectConfirmModal
          title="지원 완료"
          subtitle="프로젝트에 지원이 완료되었습니다."
          confirmText="확인"
          onConfirm={async () => {
            const positionId = selectedPosition === 'fe'
              ? project.slots.fe.positionId
              : project.slots.be.positionId;
            if (positionId !== undefined) {
              try {
                await applyToPosition(project.id, positionId);
              } catch (e) {
                console.error("합류 요청 실패", e);
                return;
              }
            }
            onApply?.(project, selectedPosition, intro);
            setShowConfirm(false);
          }}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </BaseModal>
  );
};

export default ProjectApplyModal;
