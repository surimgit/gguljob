import { CheckCircle } from 'lucide-react';

interface WithdrawCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WithdrawCompleteModal = ({ isOpen, onClose }: WithdrawCompleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-8 w-[400px] shadow-2xl"
        style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-4">
          {/* 아이콘 영역 */}
          <div className="bg-green-100 rounded-2xl p-4 mb-2">
            <CheckCircle className="text-green-500 w-8 h-8" />
          </div>

          {/* 텍스트 영역 */}
          <h2 className="text-xl font-bold text-gray-900">탈퇴 완료</h2>
          <p className="text-sm text-gray-500 text-center leading-relaxed">
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
      </div>
    </div>
  );
};

export default WithdrawCompleteModal;
