import { CheckCircle } from 'lucide-react';
import { BaseModal } from '../../common';

interface WithdrawCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WithdrawCompleteModal = ({ isOpen, onClose }: WithdrawCompleteModalProps) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center gap-4">
        {/* 아이콘 영역 */}
        <div className="bg-green-100 rounded-2xl p-4 mb-2">
          <CheckCircle className="text-green-500 w-8 h-8" />
        </div>

        {/* 텍스트 영역 */}
        <h2 className="text-xl font-bold text-gray-900">탈퇴 완료</h2>
        <p className="text-base text-gray-500 text-center leading-relaxed">
          회원 탈퇴가 완료되었습니다.
          <br />
          서비스를 이용해주셔서 감사합니다.
        </p>

        {/* 버튼 영역 */}
        <div className="flex w-full mt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-transparent bg-gray-900 text-white font-semibold text-base hover:bg-gray-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default WithdrawCompleteModal;
