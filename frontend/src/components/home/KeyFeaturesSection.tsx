import Container from '../common/Container';

type FeatureItemProps = {
  number: string;
  badge: string;
  title: string;
  description: string;
  emoji: string;
  bg: string;
};

const FeatureItem = ({ number, badge, title, description, emoji, bg }: FeatureItemProps) => (
  <div className="py-14" style={{ backgroundColor: bg }}>
    <Container>
      <div className="flex flex-col md:flex-row items-center gap-10 py-12">
        {/* 텍스트 */}
        <div className="flex-1 flex flex-col gap-4">
          <span className="text-5xl font-extrabold text-text-tertiary">{number}</span>
          <span className="inline-flex self-start items-center bg-primary-hover text-text-brown text-xl font-extrabold px-10 py-2 rounded-full">
            {badge}
          </span>
          <h3 className="text-5xl font-bold text-text-brown">{title}</h3>
          <p className="text-lg font-semibold text-text-secondary leading-[3rem] whitespace-pre-line mt-4">{description}</p>
        </div>

        {/* 목업 이미지 플레이스홀더 */}
        {/* TODO: 실제 스크린샷/목업 이미지로 교체 */}
        <div className="flex-shrink-0 w-full md:w-[700px] h-120 bg-white border border-border rounded-2xl shadow-md flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-text-tertiary">
            <span className="text-5xl">{emoji}</span>
            <span className="text-sm">미리보기 이미지</span>
          </div>
        </div>
      </div>
    </Container>
  </div>
);

const FEATURES: FeatureItemProps[] = [
  {
    number: '01',
    badge: '최적의 팀 매칭',
    title: 'Team Building',
    description:
      '아이디어를 현실로 구현할 팀을 연결해요. \n 기술 스택, 목표, 협업 성향을 바탕으로 \n 나와 잘 맞는 팀원과 프로젝트를 찾을 수 있어요.',
    emoji: '🔍',
    bg: '#F8EFD2',
  },
  {
    number: '02',
    badge: '개발 기록 정리',
    title: 'Trouble Shooting',
    description:
      '개발 중 겪은 문제와 해결 과정을 한 곳에 기록해요. \n 흩어지기 쉬운 고민의 흐름을 정리해 \n 나만의 트러블슈팅 자산으로 남길 수 있어요.',
    emoji: '🛠️',
    bg: '#FFFCF0',
  },
  {
    number: '03',
    badge: '맞춤형 채용 추천',
    title: 'Job Matching',
    description:
      '내 프로젝트 경험과 맞는 채용 공고를 추천받아요. \n 포트폴리오와 연결되는 공고를 빠르게 확인하고 \n 다음 기호까지 자연스럽게 이어갈 수 있어요.',
    emoji: '💼',
    bg: '#EEE4C6',
  },
];

const KeyFeaturesSection = () => (
  <section>
    <div className="py-10" style={{ backgroundColor: '#FFFAEB' }}>
      <Container>
        <h2 className="text-4xl font-bold text-text-brown text-center">Key Features</h2>
      </Container>
    </div>
    {FEATURES.map((feature) => (
      <FeatureItem key={feature.number} {...feature} />
    ))}
  </section>
);

export default KeyFeaturesSection;
