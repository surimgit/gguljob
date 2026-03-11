import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/common/Container';

// ── 섹션 1: Hero ────────────────────────────────────────────────

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

// ── 섹션 2: 꿀잡은 이렇게 흘러가요 ────────────────────────────────

type FlowCardProps = {
  emoji: string;
  title: string;
  description: string;
  link: string;
};

const FlowCard = ({ emoji, title, description, link }: FlowCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col gap-4 shadow-sm border border-border hover:shadow-md transition-shadow">
      {/* 이미지 플레이스홀더 */}
      {/* TODO: 실제 이미지로 교체 */}
      <div className="w-full h-36 bg-primary-soft rounded-xl flex items-center justify-center text-5xl">
        {emoji}
      </div>
      <h3 className="text-lg font-bold text-text-primary">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed flex-1">{description}</p>
      <button
        onClick={() => navigate(link)}
        className="self-start flex items-center gap-1 text-sm font-semibold text-text-brown-2 hover:underline"
      >
        바로가기 &gt;
      </button>
    </div>
  );
};

const FLOW_CARDS: FlowCardProps[] = [
  {
    emoji: '🔍',
    title: '팀 빌딩',
    description: '원하는 역할의 팀원을 찾고 함께 프로젝트를 시작해보세요.',
    link: '/projects',
  },
  {
    emoji: '📋',
    title: '프로젝트 관리',
    description: '프로젝트 기획부터 일정, 역할 분배까지 한 곳에서 관리하세요.',
    link: '/projects',
  },
  {
    emoji: '🛠️',
    title: '트러블 슈팅',
    description: '개발 중 만나는 오류와 문제를 팀원들과 함께 해결하세요.',
    link: '/projects',
  },
  {
    emoji: '💼',
    title: '취업 준비',
    description: '프로젝트 경험을 바탕으로 맞춤 채용 공고를 추천받으세요.',
    link: '/recruitment',
  },
];

const FlowSection = () => (
  <section className="bg-white py-20">
    <Container>
      {/* 헤더 */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-text-primary mb-3">
          꿀잡은 이렇게 흘러가요 🍯
        </h2>
        <p className="text-text-secondary leading-relaxed">
          팀 빌딩부터 기획, 개발, 트러블슈팅, 취업 준비까지
          <br />
          프로젝트의 전 과정을 한 번에 완성해보세요.
        </p>
      </div>

      {/* 카드 4개 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FLOW_CARDS.map((card) => (
          <FlowCard key={card.title} {...card} />
        ))}
      </div>
    </Container>
  </section>
);

// ── 섹션 3: Key Features ────────────────────────────────────────

type FeatureItemProps = {
  number: string;
  badge: string;
  title: string;
  description: string;
  emoji: string;
};

const FeatureItem = ({ number, badge, title, description, emoji }: FeatureItemProps) => (
  <div className="flex flex-col md:flex-row items-center gap-10 py-14 border-b border-border last:border-none">
    {/* 텍스트 */}
    <div className="flex-1 flex flex-col gap-4">
      <span className="text-5xl font-extrabold text-primary-hover opacity-40">{number}</span>
      <span className="inline-flex self-start items-center bg-primary text-text-brown text-xs font-semibold px-3 py-1 rounded-full">
        {badge}
      </span>
      <h3 className="text-3xl font-bold text-text-primary">{title}</h3>
      <p className="text-text-secondary leading-relaxed">{description}</p>
    </div>

    {/* 목업 이미지 플레이스홀더 */}
    {/* TODO: 실제 스크린샷/목업 이미지로 교체 */}
    <div className="flex-shrink-0 w-full md:w-96 h-56 bg-white border border-border rounded-2xl shadow-md flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-text-tertiary">
        <span className="text-5xl">{emoji}</span>
        <span className="text-sm">미리보기 이미지</span>
      </div>
    </div>
  </div>
);

const FEATURES: FeatureItemProps[] = [
  {
    number: '01',
    badge: '팀원의 일원이면',
    title: 'Team Building',
    description:
      '마음이 맞는 개발자를 찾아 팀을 구성하고, 다양한 스택, 직군, 경험 분야별로 원하는 팀프로젝트로 팀을 만들 수 있어요.',
    emoji: '🔍',
  },
  {
    number: '02',
    badge: '기업 기록 정리',
    title: 'Trouble Shooting',
    description:
      '팀 원 전체 현업 기록 정리로 해결된 오류 (개발팀), 클라이언트 문서나 이슈사항 기록을 남기면 팀 내 이슈해결 능력을 높일 수 있어요.',
    emoji: '🛠️',
  },
  {
    number: '03',
    badge: '맞춤형 채용 추천',
    title: 'Job Matching',
    description:
      '내 프로젝트에 등록된 기술스택과 포지션을 토대로 맞춤 채용 공고를 추천해드립니다. 이를 기반으로 이력서까지 한 번에 준비할 수 있어요.',
    emoji: '💼',
  },
];

const KeyFeaturesSection = () => (
  <section className="bg-primary-soft py-20">
    <Container>
      <h2 className="text-3xl font-bold text-text-primary mb-2">Key Features</h2>
      <div>
        {FEATURES.map((feature) => (
          <FeatureItem key={feature.number} {...feature} />
        ))}
      </div>
    </Container>
  </section>
);

// ── 메인 Home 컴포넌트 ────────────────────────────────────────────

const Home = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1">
      <HeroSection />
      <FlowSection />
      <KeyFeaturesSection />
    </main>
    <Footer />
  </div>
);

export default Home;
