import type { TeamDashboard } from '../../../../types/project';
import { getRoleDisplayName, getRoleColor } from '../../../../constants/skills';

interface OverviewProps {
  projectInfo: TeamDashboard['projectInfo'];
  teamStats: TeamDashboard['teamStats'];
}

const Overview = ({ projectInfo, teamStats }: OverviewProps) => {
  const roleEntries = Object.entries(teamStats.roleCounts);

  return (
    <div className="flex flex-col gap-8">
      {/* 프로젝트 설명 */}
      <section>
        <h3 className="text-[17px] font-black text-text-primary mb-3">프로젝트 소개</h3>
        <p className="text-[14px] text-text-secondary leading-[24px] whitespace-pre-wrap">
          {projectInfo.description || '프로젝트 소개가 아직 작성되지 않았습니다.'}
        </p>
      </section>

      {/* 팀 현황 카드 */}
      <section>
        <h3 className="text-[17px] font-black text-text-primary mb-4">팀 현황</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="팀원 수" value={`${teamStats.totalMembers}명`} />
          <StatCard label="총 커밋" value={`${teamStats.totalCommits}회`} />
          <StatCard label="트러블슈팅" value={`${teamStats.totalTroubleshootings}건`} />
          <StatCard label="포지션" value={`${roleEntries.length}개`} />
        </div>
      </section>

      {/* 포지션별 구성 */}
      {roleEntries.length > 0 && (
        <section>
          <h3 className="text-[17px] font-black text-text-primary mb-4">포지션 구성</h3>
          <div className="flex flex-wrap gap-3">
            {roleEntries.map(([role, count]) => (
              <div
                key={role}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getRoleColor(role) }}
                />
                <span className="text-[13px] font-bold text-text-primary">
                  {getRoleDisplayName(role)}
                </span>
                <span className="text-[13px] font-black text-text-tertiary">{count}명</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 기술스택 미리보기 */}
      {projectInfo.skills.length > 0 && (
        <section>
          <h3 className="text-[17px] font-black text-text-primary mb-3">기술스택</h3>
          <div className="flex flex-wrap gap-2">
            {projectInfo.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 rounded-full text-[12px] font-bold border border-border text-text-secondary bg-surface"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col items-center gap-1 py-5 rounded-2xl bg-[#f9fafb] border border-border">
    <span className="text-[20px] font-black text-text-primary">{value}</span>
    <span className="text-[12px] font-bold text-text-tertiary">{label}</span>
  </div>
);

export default Overview;
