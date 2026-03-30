import { LogOut } from 'lucide-react';
import { BaseModal } from '../../common';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const WithdrawModal = ({ isOpen, onClose, onConfirm }: WithdrawModalProps) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center gap-4">
        {/* 아이콘 영역 */}
        <div className="bg-red-100 rounded-2xl p-4 mb-2">
          <LogOut className="text-red-500 w-8 h-8" />
        </div>

        {/* 텍스트 영역 */}
        <h2 className="text-xl font-bold text-gray-900">꿀잡 탈퇴하기</h2>
        <p className="text-base text-gray-500 text-center leading-relaxed">
          꿀잡에서 탈퇴하시겠습니까?
          <br />
          모든 데이터가 삭제되며 되돌릴 수 없습니다.
        </p>

        {/* 버튼 영역 */}
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-border text-text-primary font-medium text-base hover:bg-background transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-base hover:bg-red-600 transition-colors"
          >
            탈퇴하기
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default WithdrawModal;
