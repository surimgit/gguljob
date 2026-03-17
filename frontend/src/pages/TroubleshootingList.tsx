import TroubleshootingCard from '../components/feature/troubleshooting/TroubleshootingCard';
import type { TroubleshootingCardItem } from '../components/feature/troubleshooting/TroubleshootingCard';

const MOCK_DATA: TroubleshootingCardItem[] = [
  {
    id: 1,
    title: '초기 로딩 속도 개선 작업 1',
    description:
      'Lighthouse 기준 성능 지표를 60점에서 90점 이상으로 올리기 위해 코드 스플리팅을 진행 중입니다.',
    date: '2026.03.10',
    status: 'in_progress',
    projectName: 'DevMatch',
  },
  {
    id: 2,
    title: '무한 스크롤 메모리 누수 해결 2',
    description:
      'Intersection Observer API를 최적화하여 스크롤 시 발생하는 DOM 노드 누적 현상을 해결했습니다.',
    date: '2026.03.09',
    status: 'resolved',
    projectName: 'React 스터디',
  },
  {
    id: 3,
    title: '무한 스크롤 메모리 누수 해결 3',
    description:
      'Intersection Observer API를 최적화하여 스크롤 시 발생하는 DOM 노드 누적 현상을 해결했습니다.',
    date: '2026.03.08',
    status: 'resolved',
    projectName: 'DevMatch',
  },
];

const TroubleshootingList = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
    <div className="flex flex-col gap-4">
      {MOCK_DATA.map((item) => (
        <TroubleshootingCard key={item.id} item={item} />
      ))}
    </div>
  </div>
);

export default TroubleshootingList;
