import { ChevronDown } from 'lucide-react';
import heroSectionSlogan from '../../assets/images/herosection_slogan.png';
import heroSectionBee from '../../assets/images/herosection_bee.png';

const HeroSection = () => {
  return (
    <section className="min-h-[520px] flex flex-col items-center justify-start relative overflow-hidden pt-14 pb-16" style={{ backgroundColor: '#FFFAEB' }}>
      {/* 슬로건 이미지 - 중앙 상단 */}
      <img src={heroSectionSlogan} alt="개발자를 위한 올인원 꿀 서비스" className="h-27 w-auto -mb-20" />

      {/* 메인 콘텐츠 */}
      <div className="flex items-center gap-16 px-20">
        {/* 벌 캐릭터 이미지 + 그라데이션 원 */}
        <div className="relative flex items-center justify-center w-120 h-120">
          {/* 우측 상단 그라데이션 원 */}
          <div className="absolute top-4 right-4 w-2/5 h-2/5 rounded-full bg-primary-hover/50 blur-2xl" />
          {/* 좌측 하단 그라데이션 원 */}
          <div className="absolute bottom-4 left-4 w-2/5 h-2/5 rounded-full bg-primary-hover/50 blur-2xl" />
          <img src={heroSectionBee} alt="꿀잡 히어로 캐릭터" className="relative w-full h-full object-contain animate-float" />
        </div>

        {/* 텍스트 */}
        <div className="flex flex-col gap-6 mt-8 -ml-6">
          <h1 className="text-6xl font-bold text-text-brown leading-tight whitespace-nowrap">
            개발 프로젝트의 시작부터
            <br />
            채용 매칭까지 한 번에&nbsp;!
          </h1>
          <p className="text-3xl text-text-brown-2 font-semibold whitespace-nowrap">
            개발의 모든 과정을 한 곳에서 관리하세요.
          </p>
        </div>
      </div>

      {/* 아래 화살표 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <ChevronDown className="w-12 h-12 text-primary-hover" />
      </div>
    </section>
  );
};

export default HeroSection;
