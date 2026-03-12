import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Container from '../common/Container';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-primary min-h-[520px] flex items-center relative overflow-hidden">
      <Container className="w-full py-20">
        <div className="flex items-center justify-between gap-8">
          {/* 텍스트 영역 */}
          <div className="flex-1 flex flex-col gap-5">
            {/* 배지 */}
            <div className="inline-flex self-start items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm text-sm font-medium text-text-primary">
              개발자를 위한 올인원 꿀 서비스 🐝
            </div>

            {/* 메인 타이틀 */}
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary leading-tight">
              개발 프로젝트의 시작부터
              <br />
              채용 매칭까지 한 번에&nbsp;!
            </h1>

            {/* 서브타이틀 */}
            <p className="text-base text-text-brown font-medium">
              개발의 모든 과정을 한 곳에서 관리하세요.
            </p>

            {/* CTA 버튼 */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => navigate('/projects')}
                className="bg-text-primary text-white px-6 py-3 rounded-xl font-semibold hover:opacity-80 transition-opacity"
              >
                프로젝트 찾기
              </button>
              <button
                onClick={() => navigate('/recruitment')}
                className="bg-white text-text-primary px-6 py-3 rounded-xl font-semibold border border-text-primary hover:bg-gray-50 transition-colors"
              >
                채용 공고 보기
              </button>
            </div>
          </div>

          {/* 벌 캐릭터 이미지 플레이스홀더 */}
          {/* TODO: 실제 이미지로 교체 — <img src={beeHeroImage} alt="꿀잡 히어로 캐릭터" className="w-80 h-80 object-contain" /> */}
          <div className="flex-shrink-0 w-72 h-72 md:w-96 md:h-80 bg-primary-hover rounded-3xl flex items-center justify-center text-7xl shadow-inner">
            🐝
          </div>
        </div>
      </Container>

      {/* 아래 화살표 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-text-brown opacity-60" />
      </div>
    </section>
  );
};

export default HeroSection;
