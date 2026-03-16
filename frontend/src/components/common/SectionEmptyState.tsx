import mypageImg from '../../assets/images/mypage.png';

interface SectionEmptyStateProps {
  message: string;
}

const SectionEmptyState = ({ message }: SectionEmptyStateProps) => (
  <div className="flex items-center justify-center w-full h-full">
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl w-full h-full gap-4 py-10">
      <img src={mypageImg} alt="" className="w-24 h-24 object-contain" />
      <p className="text-[13px] font-bold text-text-brown text-center">{message}</p>
    </div>
  </div>
);

export default SectionEmptyState;
