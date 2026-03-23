import mypageImg from '../../../assets/images/mypage.png';

interface EmptyStateProps {
  message?: string;
}

const EmptyState = ({ message = '아직 등록된 내용이 없습니다.' }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <img src={mypageImg} alt="내용 없음" className="w-48 h-48 object-contain" />
      <p className="text-lg text-text-secondary font-medium">{message}</p>
    </div>
  );
};

export default EmptyState;
