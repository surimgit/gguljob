import { useState } from 'react';
import Overview from '../components/feature/detail/tabs/Overview';
import TeamMembers from '../components/feature/detail/tabs/TeamMembers';
import TechStack from '../components/feature/detail/tabs/TechStack';
import Apply from '../components/feature/detail/tabs/Apply';
import Board from '../components/feature/detail/tabs/Board';

const TABS = ['소개', '팀원', '기술스택', '지원하기', '게시판'] as const;
type Tab = (typeof TABS)[number];

const TAB_COMPONENTS: Record<Tab, React.ReactNode> = {
  소개: <Overview />,
  팀원: <TeamMembers />,
  기술스택: <TechStack />,
  지원하기: <Apply />,
  게시판: <Board />,
};

const ProjectDetail = () => {
  const [activeTab, setActiveTab] = useState<Tab>('소개');

  return (
    <div>
      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-amber-500 text-amber-500'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-6">{TAB_COMPONENTS[activeTab]}</div>
    </div>
  );
};

export default ProjectDetail;
