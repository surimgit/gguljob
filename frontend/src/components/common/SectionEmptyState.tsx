import mypageImg from '../../assets/images/mypage.png';

/**
 * 섹션에 데이터가 없을 때 표시하는 Empty State 컴포넌트
 *
 * @param message - 사용자에게 보여줄 안내 문구
 * @param imageSrc - 표시할 이미지 경로 (기본값: mypageImg 꿀벌 장식 이미지)
 * @param imageAlt - 이미지 alt 텍스트
 *   - 장식용 이미지(정보 전달 목적 없음)인 경우 빈 문자열 "" 유지 (기본값, 스크린 리더가 무시)
 *   - 정보 전달 목적의 이미지인 경우 구체적인 설명 문자열 전달
 */
interface SectionEmptyStateProps {
  message: string;
  imageSrc?: string;
  imageAlt?: string;
}

const SectionEmptyState = ({ message, imageSrc = mypageImg, imageAlt = '' }: SectionEmptyStateProps) => (
  <div className="flex items-center justify-center w-full h-full">
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl w-full h-full gap-4 py-10">
      <img src={imageSrc} alt={imageAlt} className="w-24 h-24 object-contain" />
      <p className="text-[13px] font-bold text-text-brown text-center">{message}</p>
    </div>
  </div>
);

export default SectionEmptyState;
