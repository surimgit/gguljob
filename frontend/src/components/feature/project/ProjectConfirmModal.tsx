import BaseModal from '../../common/BaseModal';
import { Check } from 'lucide-react';

interface ProjectConfirmModalProps {
  title: string;
  subtitle: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const ProjectConfirmModal = ({
  title,
  subtitle,
  confirmText = '확인',
  cancelText,
  onConfirm,
  onClose,
}: ProjectConfirmModalProps) => {
  return (
    <BaseModal
      isOpen
      onClose={onClose}
      containerClassName="bg-white rounded-[20px] w-[400px] shadow-2xl p-[32px] text-center"
    >
      {/* 체크 아이콘 */}
      <div className="flex justify-center mb-[20px]">
        <div className="w-[56px] h-[56px] rounded-full bg-[#E8F5E9] flex items-center justify-center">
          <Check size={28} className="text-[#22c55e]" />
        </div>
      </div>

      {/* 텍스트 */}
      <h3 className="font-black text-[#111827] text-[18px] mb-[8px]">{title}</h3>
      <p className="text-[#9ca3af] text-[14px] font-bold mb-[28px]">{subtitle}</p>

      {/* 버튼 */}
      <div className="flex gap-[12px]">
        {cancelText && (
          <button
            onClick={onClose}
            className="flex-1 py-[14px] rounded-[12px] border-2 border-[#e5e7eb] text-[#6b7280] font-bold text-[14px] hover:bg-[#f7f8fa] transition-colors"
          >
            {cancelText}
          </button>
        )}
        <button
          onClick={onConfirm}
          className="flex-1 py-[14px] rounded-[12px] bg-[#22c55e] text-white font-bold text-[14px] hover:bg-[#16a34a] transition-colors"
        >
          {confirmText}
        </button>
      </div>
    </BaseModal>
  );
};

export default ProjectConfirmModal;
