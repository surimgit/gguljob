const TECH_STACKS = ['React', 'TypeScript', 'Spring Boot', 'MySQL', 'Redis', 'Git'];

type Badge = 'NEW' | 'HOT';

interface JobCardProps {
  tint: string;
  rank: number;
  badges: Badge[];
  company: string;
  role: string;
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

const JobCard = ({ tint, badges, company, role, employmentType, salary }: JobCardProps) => (
  <div
    className="relative flex-shrink-0"
    style={{
      width: '308px',
      height: '208px',
      border: '2px solid #E5E7EB',
      borderRadius: '15px',
      boxShadow: '4px 4px 4px rgba(0,0,0,0.25)',
      background: tint,
      padding: '14px 16px',
    }}
  >
    {/* 북마크 아이콘 */}
    <button className="absolute top-3 right-3" aria-label="북마크">
      <BookmarkIcon />
    </button>

    {/* 금메달 배지 플레이스홀더 */}
    <div
      className="absolute top-3 left-4"
      style={{
        width: '54px',
        height: '54px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
        border: '2px solid #F2B705',
      }}
    />

    {/* 배지 + 회사명 영역 (메달 오른쪽) */}
    <div style={{ marginLeft: '66px' }}>
      <div className="flex items-center gap-1.5 mb-1">
        {badges.map(b => (
          <BadgeChip key={b} type={b} />
        ))}
      </div>
      <p className="font-bold" style={{ fontSize: '22px', color: '#111827', lineHeight: '1.2' }}>
        {company}
      </p>
    </div>

    {/* 직무 */}
    <p
      className="font-extrabold mt-3"
      style={{ fontSize: '18px', color: '#111827', lineHeight: '1.3' }}
    >
      {role}
    </p>

    {/* 고용형태 · 연봉 */}
    <div className="flex items-center gap-1.5 absolute bottom-4 left-4">
      <span className="text-sm" style={{ color: '#6B7280' }}>
        {employmentType}
      </span>
      <span className="text-sm" style={{ color: '#6B7280' }}>·</span>
      <span className="text-sm font-bold" style={{ color: '#F2B705' }}>
        {salary}
      </span>
    </div>
  </div>
);

const JobRecommendHero = () => {
  return (
    <div style={{ width: '1103px', margin: '0 auto', background: '#F7F8FA', fontFamily: 'inherit' }}>

      {/* ── 히어로 배너 ── */}
      <div
        className="relative overflow-hidden"
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

        {/* 꿀벌 이미지 플레이스홀더 */}
        <div
          className="absolute right-16 top-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: '180px',
            height: '180px',
            background: 'rgba(217,217,217,0.5)',
            border: '2px dashed #D1D5DB',
          }}
        />
      </div>

      {/* ── 3. 맞춤 공고 TOP 3 섹션 ── */}
      <div style={{ paddingTop: '35px', paddingLeft: '42px', paddingBottom: '40px' }}>
        {/* 섹션 제목 */}
        <h2 className="font-semibold" style={{ fontSize: '25px' }}>
          <span style={{ color: '#111827' }}>맞춤 공고 </span>
          <span style={{ color: '#F2B705' }}>TOP 3</span>
        </h2>

        {/* 카드 3개 */}
        <div className="flex gap-[45px]" style={{ marginTop: '45px' }}>
          <JobCard
            tint="rgba(255,239,156,0.21)"
            rank={1}
            badges={['NEW', 'HOT']}
            company="토스"
            role="Frontend Engineer (React)"
            employmentType="정규직"
            salary="5,000~7,000만원"
          />
          <JobCard
            tint="rgba(217,234,239,0.42)"
            rank={2}
            badges={['NEW']}
            company="카카오"
            role="풀스택 개발자 (React + Spring)"
            employmentType="정규직"
            salary="5,500~8,000만원"
          />
          <JobCard
            tint="rgba(255,213,174,0.40)"
            rank={3}
            badges={['HOT']}
            company="네이버"
            role="프론트엔드 개발자"
            employmentType="정규직"
            salary="5,000~7,500만원"
          />
        </div>
      </div>
    </div>
  );
};

export default JobRecommendHero;
