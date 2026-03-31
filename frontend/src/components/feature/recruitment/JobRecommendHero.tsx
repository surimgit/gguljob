import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import goldMedalImg from '../../../assets/images/goldMedal.png';
import silverMedalImg from '../../../assets/images/silverMedal.png';
import bronzeMedalImg from '../../../assets/images/medal.png';
import jobMatchingImg from '../../../assets/images/jobmatching.png';
import { useAuthStore } from '../../../stores/authStore';
import { useUserSkills } from '../../../hooks/useUserSkills';
import type { JobItem } from '../../../types/recruitment';
import { calcDday, getDdayColor } from '../../../utils/dateUtils';
import { type MatchStatus, MATCH_CONFIG, MATCH_STATUS_TO_TYPE } from '../../../constants/match';

/** 연봉 포맷: 숫자 범위에 "만원" 붙이기, 이미 단위 있으면 그대로 */
const formatSalary = (salary: string): string => {
    if (!salary) return '회사내규';
    if (/만원|원|억/.test(salary)) return salary;
    if (/^[\d,]+([-~][\d,]+)?$/.test(salary.trim())) return `${salary}만원`;
    return salary;
};

const RANK_TINTS = ['rgba(255,239,156,0.21)', 'rgba(217,234,239,0.42)', 'rgba(255,213,174,0.40)'];

const LOGO_COLORS = ['#3B82F6', '#F2B705', '#22C55E', '#EF4444', '#8B5CF6'];

type Badge = 'NEW' | 'HOT';

interface JobCardProps {
    jobId: number;
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
    matchStatus: MatchStatus;
    bookmarked: boolean;
    onToggleBookmark: (id: number) => void;
}

const BadgeChip = ({ type }: { type: Badge }) => {
    if (type === 'NEW') {
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary-soft text-text-brown">NEW</span>;
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

const JobCard = ({
    jobId,
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
    matchStatus,
    bookmarked,
    onToggleBookmark,
}: JobCardProps) => {
    const dday = calcDday(deadline);
    const ddayColor = getDdayColor(dday);
    const match = MATCH_CONFIG[MATCH_STATUS_TO_TYPE[matchStatus] ?? 'insufficient'];

    return (
        <div
            role="link"
            tabIndex={0}
            aria-label={`${company} - ${role}`}
            onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && url) window.open(url, '_blank', 'noopener,noreferrer');
            }}
            className="relative flex flex-col cursor-pointer border-2 border-[#E5E7EB] rounded-[15px] hover:bg-primary-soft hover:border-primary-hover hover:shadow-lg transition-all duration-200 min-h-[220px] sm:min-h-[240px]"
            style={{
                boxShadow: '4px 4px 4px rgba(0,0,0,0.25)',
                background: tint,
                padding: '16px 16px 16px 16px',
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
                <button
                    aria-label="북마크"
                    className="group cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(jobId);
                    }}
                >
                    <svg
                        className="w-7 h-7 transition-all duration-200 group-hover:scale-125 group-hover:drop-shadow-[0_0_4px_rgba(242,183,5,0.5)]"
                        fill={bookmarked ? '#F2B705' : 'none'}
                        stroke={bookmarked ? '#F2B705' : '#9CA3AF'}
                        viewBox="0 0 24 24"
                        style={{ transition: 'fill 0.2s, stroke 0.2s' }}
                    >
                        <path
                            className={bookmarked ? '' : 'group-hover:fill-[#F2B705]/20 group-hover:stroke-[#F2B705]'}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                    </svg>
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

                {/* 회사명 + 배지 */}
                <div className="flex items-center gap-1.5 min-w-0">
                    <p className="font-bold truncate" style={{ fontSize: '22px', color: '#111827', lineHeight: '1.2' }}>
                        {company}
                    </p>
                    {badges.map((b) => (
                        <BadgeChip key={b} type={b} />
                    ))}
                </div>
            </div>

            {/* 직무 */}
            <p className="font-bold mt-3 truncate" style={{ fontSize: '17px', color: '#111827', lineHeight: '1.3' }}>
                {role}
            </p>

            {/* 위치 · 경력 */}
            <div className="flex items-center gap-1.5 mt-2">
                <span className="text-base" style={{ color: '#6B7280' }}>
                    {location}
                </span>
                <span className="text-base" style={{ color: '#6B7280' }}>
                    ·
                </span>
                <span className="text-base" style={{ color: '#6B7280' }}>
                    {experience}
                </span>
            </div>

            {/* 고용형태 · 연봉 + 적합도 */}
            <div className="flex items-end justify-between mt-auto">
                <div className="flex items-center gap-1.5">
                    <span className="text-base" style={{ color: '#6B7280' }}>
                        {employmentType}
                    </span>
                    <span className="text-base" style={{ color: '#6B7280' }}>
                        ·
                    </span>
                    <span className="text-base font-bold text-primary-hover">{formatSalary(salary)}</span>
                </div>
                <span
                    className="text-[15px] font-bold px-3.5 py-1.5 rounded-full"
                    style={{ background: `${match.color}18`, color: match.color }}
                >
                    {match.label}
                </span>
            </div>
        </div>
    );
};

interface JobRecommendHeroProps {
    top3Jobs: JobItem[];
    bookmarkedIds: Set<number>;
    onToggleBookmark: (id: number) => void;
}

const VISIBLE_SKILL_COUNT = 8;

const JobRecommendHero = ({ top3Jobs, bookmarkedIds, onToggleBookmark }: JobRecommendHeroProps) => {
    const user = useAuthStore((s) => s.user);
    const userSkills = useUserSkills();
    const [showAllSkills, setShowAllSkills] = useState(false);

    const userName = user?.name ?? '사용자';
    const hasMore = userSkills.length > VISIBLE_SKILL_COUNT;
    const visibleSkills = showAllSkills ? userSkills : userSkills.slice(0, VISIBLE_SKILL_COUNT);
    const hiddenCount = userSkills.length - VISIBLE_SKILL_COUNT;

    return (
        <>
            {/* ── 히어로 배너 + 이미지 래퍼 ── */}
            <div className="relative w-[calc(100%+32px)] sm:w-[calc(100%+48px)] lg:w-[calc(100%+64px)] -mx-4 sm:-mx-6 lg:-mx-8 -mt-8">
                {/* 배너 배경 */}
                <div data-navbar-hero className="overflow-hidden bg-primary-soft/[0.36]" style={{ minHeight: '380px' }}>
                    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative flex flex-col justify-center pt-16 sm:pt-20 pb-12 sm:pb-14 lg:pl-[6%]">
                        {/* 메인 타이틀 */}
                        <p
                            className="font-bold text-[28px] sm:text-[32px] lg:text-[40px]"
                            style={{ color: '#111827', lineHeight: '1.35' }}
                        >
                            {userName}님의 기술 스택과
                            <br />
                            가장 잘 맞는 채용 공고를 추천해드려요!
                        </p>

                        {/* 부제목 */}
                        <p
                            className="mt-5 sm:mt-6 text-[16px] sm:text-[18px] lg:text-[22px]"
                            style={{ color: '#4A5565' }}
                        >
                            포트폴리오 키워드와 기술 스택 유사도를 분석하여 추천합니다
                        </p>

                        {/* 기술스택 태그 — 접기/펼치기 */}
                        {userSkills.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mt-5 max-w-full lg:max-w-[50%]">
                                {visibleSkills.map((stack) => (
                                    <span
                                        key={stack}
                                        className="font-semibold"
                                        style={{
                                            background: '#BFE8F5',
                                            borderRadius: '8px',
                                            fontSize: '16px',
                                            color: '#6B7280',
                                            padding: '6px 14px',
                                            boxShadow: '2px 2px 4px rgba(0,0,0,0.15)',
                                        }}
                                    >
                                        {stack}
                                    </span>
                                ))}
                                {hasMore && (
                                    <button
                                        onClick={() => setShowAllSkills((prev) => !prev)}
                                        className={`flex items-center gap-1 font-semibold text-sm px-3.5 py-1.5 rounded-lg shadow-[2px_2px_4px_rgba(0,0,0,0.15)] cursor-pointer hover:opacity-80 transition-opacity ${
                                            showAllSkills
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'bg-[#F2B705] text-white'
                                        }`}
                                    >
                                        {showAllSkills ? (
                                            <>접기 <ChevronUp className="w-4 h-4" /></>
                                        ) : (
                                            <>+{hiddenCount}개 더 <ChevronDown className="w-4 h-4" /></>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 잡매칭 이미지 — 배너 밖으로 빠져나와 섹션에 걸침 */}
                <img
                    src={jobMatchingImg}
                    alt="잡매칭"
                    className="absolute right-[6%] top-[16%] hidden xl:block"
                    style={{ width: '450px', height: 'auto', zIndex: 10 }}
                />
            </div>

            {/* ── 맞춤 공고 TOP 3 섹션 (max-w 제한) ── */}
            <div
                className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8"
                style={{ paddingTop: '24px', paddingBottom: '28px' }}
            >
                <h2 className="font-bold text-[22px] sm:text-[26px] lg:text-[30px]">
                    <span style={{ color: '#111827' }}>맞춤 공고 </span>
                    <span style={{ color: '#F2B705' }}>TOP 3</span>
                </h2>

                <div
                    className="flex gap-4 lg:gap-6 overflow-x-auto overflow-y-visible snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible pt-14 -mt-20"
                    style={{ marginTop: '10px' }}
                >
                    {top3Jobs.length === 0 ? (
                        <div className="col-span-3 flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-8 h-8 border-3 border-[#F2B705] border-t-transparent rounded-full animate-spin" />
                            <p className="text-[15px] font-bold text-text-secondary">맞춤 공고를 분석 중입니다...</p>
                        </div>
                    ) : top3Jobs.map((job: JobItem, idx: number) => (
                        <div
                            key={job.jobId}
                            className="min-w-[300px] w-[75vw] sm:w-[45vw] shrink-0 lg:w-auto lg:min-w-0 lg:shrink snap-start"
                        >
                            <JobCard
                                jobId={job.jobId}
                                tint={RANK_TINTS[idx]}
                                rank={idx + 1}
                                badges={['NEW']}
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
                                matchStatus={job.matchStatus}
                                bookmarked={bookmarkedIds.has(job.jobId)}
                                onToggleBookmark={onToggleBookmark}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};



export default JobRecommendHero;
