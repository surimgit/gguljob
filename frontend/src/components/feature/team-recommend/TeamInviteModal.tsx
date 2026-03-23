import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';
import { BaseModal } from '../../common';
import { getMyProjects, inviteUser } from '../../../api/projects';
import type { ProjectSimple } from '../../../types/project';
import { ROLE_LIST, ROLE_DISPLAY_NAMES, ROLE_TO_API } from '../../../constants/skills';

interface TeamInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  userId: number;
}

const JOB_OPTIONS = ROLE_LIST.map(code => ({
  label: ROLE_DISPLAY_NAMES[code],
  role: ROLE_TO_API[code],
}));

const MAX_MESSAGE_LENGTH = 200;

const TeamInviteModal = ({ isOpen, onClose, memberName, userId }: TeamInviteModalProps) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [message, setMessage] = useState('');
  const [projects, setProjects] = useState<ProjectSimple[]>([]);

  useEffect(() => {
    if (isOpen) {
      getMyProjects().then(({ data }) => setProjects(data)).catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedProject) return;
    try {
      await inviteUser(Number(selectedProject), userId, {
        role: selectedJob,
        appealContent: message || undefined,
      });
      toast.success(`${memberName}님에게 초대를 보냈습니다.`);
      onClose();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 409) {
        toast.error('이미 초대된 사용자입니다.');
      } else {
        toast.error('초대에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleClose = () => {
    setSelectedProject('');
    setSelectedJob('');
    setMessage('');
    onClose();
  };

  const isValid = selectedProject !== '' && selectedJob !== '';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      containerClassName="bg-white rounded-3xl w-[480px] overflow-hidden shadow-2xl"
    >
      {/* 상단 바 */}
      <div className="h-11 bg-primary w-full relative flex items-center justify-end px-5">
        <button
          type="button"
          onClick={handleClose}
          className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="px-8 py-5">
        <h2 className="text-lg font-bold text-text-primary mb-1">{memberName}님을 팀에 초대하기</h2>
        <p className="text-sm text-text-secondary mb-4">초대할 프로젝트와 직무를 선택하세요</p>

        {/* 프로젝트 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-text-primary mb-2">
            프로젝트 선택 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full appearance-none rounded-xl border-2 border-border bg-white px-4 py-2.5 pr-10 text-sm text-text-primary focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">프로젝트를 선택하세요</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>{p.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          </div>
        </div>

        {/* 직무 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-text-primary mb-2">
            직무 선택 <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {JOB_OPTIONS.map((job) => (
              <button
                key={job.role}
                type="button"
                onClick={() => setSelectedJob(selectedJob === job.role ? '' : job.role)}
                className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition-colors ${
                  selectedJob === job.role
                    ? 'border-primary-hover bg-primary-soft text-primary-hover'
                    : 'border-border bg-white text-text-secondary hover:border-primary hover:bg-primary-soft'
                }`}
              >
                {job.label}
              </button>
            ))}
          </div>
        </div>

        {/* 초대 메시지 */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-text-primary mb-2">
            초대 메시지
          </label>
          <textarea
            value={message}
            onChange={(e) => {
              if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                setMessage(e.target.value);
              }
            }}
            placeholder="함께 하고 싶은 이유를 간단히 적어주세요"
            rows={3}
            className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none resize-none transition-colors"
          />
          <p className="text-xs text-text-tertiary text-right mt-1">
            {message.length}/{MAX_MESSAGE_LENGTH}
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl border-2 border-border text-sm font-semibold text-text-secondary hover:bg-background transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-text-primary)',
            }}
          >
            초대 보내기
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default TeamInviteModal;
