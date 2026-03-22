import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTeamDashboard } from '../api/projects';
import type { TeamDashboard } from '../types/project';
import Overview from '../components/feature/detail/tabs/Overview';
import TeamMembers from '../components/feature/detail/tabs/TeamMembers';
import TechStack from '../components/feature/detail/tabs/TechStack';
import Apply from '../components/feature/detail/tabs/Apply';
import Board from '../components/feature/detail/tabs/Board';

const TABS = ['소개', '팀원', '기술스택', '지원하기', '게시판'] as const;
type Tab = (typeof TABS)[number];

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const [activeTab, setActiveTab] = useState<Tab>('소개');
  const [dashboard, setDashboard] = useState<TeamDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    getTeamDashboard(projectId)
      .then(({ data }) => {
        setDashboard(data);
        setError(null);
      })
      .catch((err) => {
        console.error('[프로젝트 상세] 조회 실패:', err);
        setError('프로젝트 정보를 불러올 수 없습니다.');
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-text-secondary text-[15px]">{error ?? '프로젝트를 찾을 수 없습니다.'}</p>
      </div>
    );
  }

  const { projectInfo, teamStats } = dashboard;

  const renderTab = () => {
    switch (activeTab) {
      case '소개':
        return <Overview projectInfo={projectInfo} teamStats={teamStats} />;
      case '팀원':
        return <TeamMembers dashboard={dashboard} projectId={projectId} />;
      case '기술스택':
        return <TechStack skills={projectInfo.skills} />;
      case '지원하기':
        return <Apply projectId={projectId} />;
      case '게시판':
        return <Board />;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 프로젝트 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[13px] font-bold text-primary-hover bg-primary-soft px-3 py-1 rounded-lg">
            {projectInfo.domain || '프로젝트'}
          </span>
          <span className="text-[13px] font-bold text-text-tertiary">{projectInfo.teamName}</span>
        </div>
        <h1 className="text-[28px] font-black text-text-primary tracking-[-0.5px]">
          {projectInfo.title}
        </h1>
        <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
          {projectInfo.description}
        </p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 font-bold text-[14px] transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary-hover'
                : 'text-text-tertiary hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="mt-6">{renderTab()}</div>
    </div>
  );
};

export default ProjectDetail;
