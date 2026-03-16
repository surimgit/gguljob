import goldMedalImg from '../../../assets/images/goldMedal.png';
import silverMedalImg from '../../../assets/images/silverMedal.png';
import bronzeMedalImg from '../../../assets/images/medal.png';
import jobMatchingImg from '../../../assets/images/jobmatching.png';

const TECH_STACKS = ['React', 'TypeScript', 'Spring Boot', 'MySQL', 'Redis', 'Git'];

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
}: JobCardProps) => (
  <div
    className="relative flex-shrink-0 flex flex-col"
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
    {/* 랭킹 메달 — 원이 카드 위로 돌출, 리본이 원 하단부를 가로지름 */}
    <div className="absolute" style={{ top: rank === 3 ? '-44px' : '-48px', left: '6px' }}>
      <RankMedal rank={rank} />
    </div>

    {/* 북마크 */}
    <button className="absolute top-3 right-3" aria-label="북마크">
      <BookmarkIcon />
    </button>

    {/* 회사 로고 + 배지 + 회사명 */}
    <div className="flex items-center gap-3 mt-5">
      {/* 로고 */}
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

      {/* 배지 + 회사명 */}
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
      className="font-bold mt-2"
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

const JobRecommendHero = () => {
  return (
    <div style={{ width: '1103px', margin: '0 auto', background: '#F7F8FA', fontFamily: 'inherit' }}>

      {/* ── 히어로 배너 ── */}
      <div
        className="relative"
        style={{
          height: '299px',
          background: 'linear-gradient(to bottom, rgba(255,242,198,0.36), rgba(247,201,72,0.36))',
        }}
      >
        {/* 메인 타이틀 */}
        <div style={{ position: 'absolute', top: '40px', left: '42px' }}>
          <p
            className="font-semibold"
            style={{ fontSize: '30px', color: '#111827', lineHeight: '1.35' }}
          >
            김도현님의 기술 스택과<br />
            가장 잘 맞는 채용 공고를 추천해드려요!
          </p>
        </div>

        {/* 부제목 */}
        <p
          style={{
            position: 'absolute',
            top: '160px',
            left: '42px',
            fontSize: '16px',
            color: '#4A5565',
          }}
        >
          포트폴리오 키워드와 기술 스택 유사도를 분석하여 추천합니다
        </p>

        {/* 기술스택 태그 */}
        <div
          className="flex items-center gap-2"
          style={{ position: 'absolute', top: '210px', left: '42px' }}
        >
          {TECH_STACKS.map(stack => (
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

        {/* 잡매칭 이미지 */}
        <img
          src={jobMatchingImg}
          alt="잡매칭"
          style={{
            position: 'absolute',
            right: -20,
            top: '17px',
            height: '400px',
            maxWidth: '600px',
            objectFit: 'contain',
            objectPosition: 'right bottom',
          }}
        />
      </div>

      {/* ── 맞춤 공고 TOP 3 섹션 ── */}
      <div style={{ paddingTop: '35px', paddingLeft: '42px', paddingBottom: '40px' }}>
        {/* 섹션 제목 */}
        <h2 className="font-semibold" style={{ fontSize: '25px' }}>
          <span style={{ color: '#111827' }}>맞춤 공고 </span>
          <span style={{ color: '#F2B705' }}>TOP 3</span>
        </h2>

        {/* 카드 3개 */}
        <div className="flex gap-[45px]" style={{ marginTop: '75px' }}>
          <JobCard
            tint="rgba(255,239,156,0.21)"
            rank={1}
            badges={['NEW', 'HOT']}
            company="토스"
            logoText="T"
            logoColor="#3B82F6"
            role="Frontend Engineer (React)"
            location="서울 강남구"
            experience="신입·경력 1~3년"
            employmentType="정규직"
            salary="5,000~7,000만원"
          />
          <JobCard
            tint="rgba(217,234,239,0.42)"
            rank={2}
            badges={['NEW']}
            company="카카오"
            logoText="K"
            logoColor="#F2B705"
            role="풀스택 개발자 (React + Spring)"
            location="경기 성남시"
            experience="경력 2~5년"
            employmentType="정규직"
            salary="5,500~8,000만원"
          />
          <JobCard
            tint="rgba(255,213,174,0.40)"
            rank={3}
            badges={['HOT']}
            company="네이버"
            logoText="N"
            logoColor="#22C55E"
            role="프론트엔드 개발자"
            location="경기 성남시"
            experience="경력 3~7년"
            employmentType="정규직"
            salary="5,000~7,500만원"
          />
        </div>
      </div>
    </div>
  );
};

export default JobRecommendHero;
