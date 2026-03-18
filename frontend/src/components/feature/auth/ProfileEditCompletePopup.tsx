import { type FC } from 'react';
import { CheckCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const ProfileEditCompletePopup: FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-[20px] w-full max-w-[400px] overflow-hidden shadow-2xl">
        {/* 상단 액센트 바 */}
        <div
          className="h-1.5"
          style={{
            background: 'linear-gradient(to right, #F7C948, #F2B705, #F59E0B)',
          }}
        />

        <div className="px-7 pt-8 pb-7 text-center">
          {/* 체크 아이콘 */}
          <div
            className="rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5"
            style={{ width: 72, height: 72 }}
          >
            <CheckCircle size={40} className="text-green-500" strokeWidth={2} />
          </div>

          <p className="text-xl font-bold text-gray-900 mb-2.5">정보 수정 완료!</p>
          <p className="text-sm text-gray-500 leading-relaxed mb-7">
            변경된 정보가 저장되었습니다.
          </p>

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl border-none bg-primary text-white text-base font-bold cursor-pointer hover:bg-amber-600 transition-colors duration-150"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditCompletePopup;
