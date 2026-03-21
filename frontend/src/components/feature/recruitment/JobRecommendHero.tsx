import { useState, useEffect } from 'react';
import goldMedalImg from '../../../assets/images/goldMedal.png';
import silverMedalImg from '../../../assets/images/silverMedal.png';
import bronzeMedalImg from '../../../assets/images/medal.png';
import jobMatchingImg from '../../../assets/images/jobmatching.png';
import { getRecommendedTop3 } from '../../../api/jobs';
import { useAuthStore } from '../../../stores/authStore';
import type { JobItem } from '../../../types/recruitment';
import { calcDday, getDdayColor } from '../../../utils/dateUtils';

const RANK_TINTS = [
  'rgba(255,239,156,0.21)',
  'rgba(217,234,239,0.42)',
  'rgba(255,213,174,0.40)',
];

const LOGO_COLORS = ['#3B82F6', '#F2B705', '#22C55E', '#EF4444', '#8B5CF6'];

type Badge = 'NEW' | 'HOT';

interface JobCardProps {
  tint: string;
  rank: number;
  badges: Badge[];
  company: string;
  logoText: string;
  logoColor: string;
  role: string;
  location: string;
  experience: string;
  employmentType: string;
  salary: string;
  url: string;
  deadline: string;
}


const BadgeChip = ({ type }: { type: Badge }) => {
  if (type === 'NEW') {
    return (
      <span
        className="text-[11px] font-bold px-2 py-0.5 rounded"
        style={{ background: '#FFF2C6', color: '#705401' }}
      >
        NEW
      </span>
    );
  }
  return (
    <span
      className="text-[11px] font-bold px-2 py-0.5 rounded"
      style={{ background: 'rgba(239,68,68,0.23)', color: '#EF4444' }}
    >
      HOT
    </span>
  );
};

const medalImages: Record<number, string> = {
  1: goldMedalImg,
  2: silverMedalImg,
  3: bronzeMedalImg,
};

const RankMedal = ({ rank }: { rank: number }) => (
  <img
    src={medalImages[rank] ?? bronzeMedalImg}
    alt={`${rank}등 메달`}
    style={{ width: '64px', height: '64px', objectFit: 'contain' }}
  />
);

const BookmarkIcon = () => (
  <svg
    className="w-5 h-5"
    style={{ color: '#9CA3AF' }}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
    />
  </svg>
);

const JobCard = ({
  tint,
  rank,
  badges,
  company,
  logoText,
  logoColor,
  role,
  location,
  experience,
  employmentType,
  salary,
  url,
  deadline,
}: JobCardProps) => {
  const dday = calcDday(deadline);
  const ddayColor = getDdayColor(dday);

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`${company} - ${role}`}
      onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}
      onKeyDown={e => { if (e.key === 'Enter' && url) window.open(url, '_blank', 'noopener,noreferrer'); }}
      className="relative flex-shrink-0 flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
      style={{
        width: '308px',
        height: '208px',
        border: '2px solid #E5E7EB',
        borderRadius: '15px',
        boxShadow: '4px 4px 4px rgba(0,0,0,0.25)',
        background: tint,
        padding: '14px 16px 14px 16px',
      }}
    >
      {/* 랭킹 메달 */}
      <div className="absolute" style={{ top: rank === 3 ? '-44px' : '-48px', left: '6px' }}>
        <RankMedal rank={rank} />
      </div>

      {/* 디데이 + 북마크 */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {dday && (
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${ddayColor}18`, color: ddayColor }}
          >
            {dday}
          </span>
        )}
        <button aria-label="북마크">
          <BookmarkIcon />
        </button>
      </div>

      {/* 회사 로고 + 배지 + 회사명 */}
      <div className="flex items-center gap-3 mt-5">
        <div
          className="flex items-center justify-center font-black text-white flex-shrink-0"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: logoColor,
            fontSize: '20px',
          }}
        >
          {logoText}
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            {badges.map(b => (
              <BadgeChip key={b} type={b} />
            ))}
          </div>
          <p className="font-bold" style={{ fontSize: '20px', color: '#111827', lineHeight: '1.2' }}>
            {company}
          </p>
        </div>
      </div>

      {/* 직무 */}
      <p
        className="font-bold mt-2 truncate"
        style={{ fontSize: '15px', color: '#111827', lineHeight: '1.3' }}
      >
        {role}
      </p>

      {/* 위치 · 경력 */}
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-sm" style={{ color: '#6B7280' }}>{location}</span>
        <span className="text-sm" style={{ color: '#6B7280' }}>·</span>
        <span className="text-sm" style={{ color: '#6B7280' }}>{experience}</span>
      </div>

      {/* 고용형태 · 연봉 */}
      <div className="flex items-center gap-1.5 mt-auto">
        <span className="text-sm" style={{ color: '#6B7280' }}>{employmentType}</span>
        <span className="text-sm" style={{ color: '#6B7280' }}>·</span>
        <span className="text-sm font-bold" style={{ color: '#F2B705' }}>{salary}</span>
      </div>
    </div>
  );
};

const JobRecommendHero = () => {
  const [top3, setTop3] = useState<JobItem[]>([]);
  const user = useAuthStore(s => s.user);

  const userName = user?.name ?? '사용자';
  const userSkills = user?.techStacks?.length ? user.techStacks : user?.skills?.map(s => s.name) ?? [];

  useEffect(() => {
    getRecommendedTop3()
      .then(({ data }) => { if (data.length > 0) setTop3(data.slice(0, 3)); })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* ── 히어로 배너 (전체 너비 — Container px-6/py-8 상쇄) ── */}
      <div
        className="relative overflow-hidden w-[calc(100%+48px)] -mx-6 -mt-8"
        style={{
          minHeight: '299px',
          background: 'linear-gradient(to bottom, rgba(255,242,198,0.36), rgba(247,201,72,0.36))',
        }}
      >
        <div className="max-w-[1400px] mx-auto px-[42px] relative flex flex-col justify-center py-14">
          {/* 메인 타이틀 */}
          <p
            className="font-semibold"
            style={{ fontSize: '30px', color: '#111827', lineHeight: '1.35' }}
          >
            {userName}님의 기술 스택과<br />
            가장 잘 맞는 채용 공고를 추천해드려요!
          </p>

          {/* 부제목 */}
          <p className="mt-6" style={{ fontSize: '16px', color: '#4A5565' }}>
            포트폴리오 키워드와 기술 스택 유사도를 분석하여 추천합니다
          </p>

          {/* 기술스택 태그 */}
          {userSkills.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-5 max-w-[50%]">
              {userSkills.slice(0, 8).map(stack => (
                <span
                  key={stack}
                  className="font-bold"
                  style={{
                    background: '#BFE8F5',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#6B7280',
                    padding: '4px 10px',
                    boxShadow: '2px 2px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  {stack}
                </span>
              ))}
            </div>
          )}

          {/* 잡매칭 이미지 — 반응형, 우측 고정 */}
          <img
            src={jobMatchingImg}
            alt="잡매칭"
            className="absolute right-0 bottom-0 h-[85%] max-h-[400px] max-w-[40%] xl:max-w-[500px] object-contain object-right-bottom hidden lg:block"
          />
        </div>
      </div>

      {/* ── 맞춤 공고 TOP 3 섹션 (max-w 제한) ── */}
      <div className="max-w-[1400px] mx-auto" style={{ paddingTop: '35px', paddingLeft: '42px', paddingRight: '42px', paddingBottom: '40px' }}>
        <h2 className="font-semibold" style={{ fontSize: '25px' }}>
          <span style={{ color: '#111827' }}>맞춤 공고 </span>
          <span style={{ color: '#F2B705' }}>TOP 3</span>
        </h2>

        <div className="flex gap-[45px]" style={{ marginTop: '75px' }}>
          {top3.map((job, idx) => (
            <JobCard
              key={job.jobId}
              tint={RANK_TINTS[idx]}
              rank={idx + 1}
              badges={job.matchStatus === '적합' ? ['NEW', 'HOT'] : job.matchStatus === '보통' ? ['NEW'] : ['HOT']}
              company={job.companyName}
              logoText={job.companyName.charAt(0)}
              logoColor={LOGO_COLORS[job.jobId % LOGO_COLORS.length]}
              role={job.title}
              location={job.region}
              experience={job.experience}
              employmentType={job.contractType}
              salary={job.salary}
              url={job.url}
              deadline={job.deadline}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default JobRecommendHero;
