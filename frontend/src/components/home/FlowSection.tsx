import { useNavigate } from 'react-router-dom';
import Container from '../common/Container';

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

export default FlowSection;
