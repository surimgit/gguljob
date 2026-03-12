import Container from '../common/Container';

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

export default KeyFeaturesSection;
