import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '../common/Container';
import mainsectionHoney from '../../assets/images/mainsection_honey.png';
import cardCreate from '../../assets/images/card_create.png';
import cardProject from '../../assets/images/card_project.png';
import cardMember from '../../assets/images/card_member.png';
import cardManagement from '../../assets/images/card_management.png';
import cardTroubleShooting from '../../assets/images/card_trouble_shooting.png';
import cardMypage from '../../assets/images/card_mypage.png';
import cardJobmatching from '../../assets/images/card_job.png';

type FlowCardProps = {
  step: number;
  title: string;
  description: string;
  link: string;
  image?: string;
};

const FlowCard = ({ step, title, description, link, image }: FlowCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(link);
  };

  return (
    <div
      className="relative rounded-3xl p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4 border-4 border-primary-hover transition-all duration-300 hover:scale-105 h-full cursor-pointer overflow-hidden"
      style={{ backgroundColor: '#FFFAEB', boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}
    >
      {/* 가장자리 흐림 오버레이 */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(255,255,255,0.65) 100%)' }}
      />

      {/* STEP 번호 */}
      <span className="self-start text-base sm:text-xl font-extrabold text-primary-hover">
        STEP {String(step).padStart(2, '0')}
      </span>

      {/* 이미지 영역 */}
      <div className="w-full h-40 sm:h-60 flex items-center justify-center">
        {image
          ? <img src={image} alt={title} className="w-full h-full object-contain" />
          : null
        }
      </div>

      {/* 카드 내용 */}
      <h3 className="text-xl sm:text-3xl font-extrabold text-text-brown text-center">{title}</h3>
      <p className="text-sm sm:text-xl font-bold text-text-brown-2 text-center leading-relaxed">{description}</p>

      <button
        onClick={handleClick}
        className="mt-2 px-8 sm:px-15 py-2.5 sm:py-3 rounded-xl text-base sm:text-xl font-semibold text-text-brown transition-opacity hover:opacity-80"
        style={{
          background: 'linear-gradient(to right, rgba(247,201,72,0.2), rgba(242,183,5,0.2))',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
        }}
      >
        보러가기 &gt;
      </button>
    </div>
  );
};

const FLOW_CARDS: FlowCardProps[] = [
  { step: 1, title: '프로젝트 생성', description: '새로운 프로젝트를 만들고 팀원을 초대해요.', link: '/projects/new', image: cardCreate         },
  { step: 2, title: '프로젝트 찾기', description: '관심 있는 프로젝트를 찾아 팀에 참여해요',  link: '/projects',    image: cardProject        },
  { step: 3, title: '팀원 찾기',    description: '내 프로젝트에 맞는 팀원을 매칭해요',       link: '/my-projects', image: cardMember         },
  { step: 4, title: '프로젝트 관리', description: '진행 중인 프로젝트를 한 곳에서 관리해요',  link: '/my-projects', image: cardManagement     },
  { step: 5, title: '트러블 슈팅',  description: '개발 과정에서의 문제와 해결 과정을 기록해요', link: '/mypage/troubleshooting', image: cardTroubleShooting },
  { step: 6, title: '마이페이지',   description: '내 프로젝트와 활동 기록을 한눈에 확인해요', link: '/mypage',      image: cardMypage         },
  { step: 7, title: '채용 공고',    description: '나와 맞는 채용 정보를 추천받아요',         link: '/recruitment', image: cardJobmatching    },
];

const VISIBLE_DESKTOP = 3;
const VISIBLE_MOBILE = 1;

const FlowSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768 ? VISIBLE_MOBILE : VISIBLE_DESKTOP
  );
  const maxIndex = FLOW_CARDS.length - 1;
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const isHoveringRef = useRef(false);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // 반응형: 화면 크기에 따라 보이는 카드 수 변경
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setVisibleCount(e.matches ? VISIBLE_DESKTOP : VISIBLE_MOBILE);
    };
    onChange(mq);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleMouseEnter = () => { isHoveringRef.current = true; };
    const handleMouseLeave = () => { isHoveringRef.current = false; };

    carousel.addEventListener('mouseenter', handleMouseEnter);
    carousel.addEventListener('mouseleave', handleMouseLeave);

    const handleWheel = (e: WheelEvent) => {
      if (!isHoveringRef.current) return;

      // 쿨다운 중에는 항상 스크롤 차단
      if (isScrollingRef.current) {
        e.preventDefault();
        return;
      }

      // 캐러셀이 화면에 완전히 보이지 않으면 일반 스크롤
      const rect = carousel.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) return;

      const idx = currentIndexRef.current;

      if (e.deltaY > 0 && idx < maxIndex) {
        e.preventDefault();
        isScrollingRef.current = true;
        setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
        setTimeout(() => { isScrollingRef.current = false; }, 400);
      } else if (e.deltaY < 0 && idx > 0) {
        e.preventDefault();
        isScrollingRef.current = true;
        setCurrentIndex(prev => Math.max(0, prev - 1));
        setTimeout(() => { isScrollingRef.current = false; }, 400);
      }
    };

    carousel.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      carousel.removeEventListener('wheel', handleWheel);
      carousel.removeEventListener('mouseenter', handleMouseEnter);
      carousel.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxIndex]);

  return (
    <section ref={sectionRef} data-navbar-hero className="py-20" style={{ backgroundColor: '#FFFAEB' }}>
      <Container>
        {/* 헤더 */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-5xl font-bold text-text-primary mt-4 sm:mt-8 mb-4 sm:mb-6">
            <span className="text-3xl sm:text-6xl text-text-brown">꿀잡</span>은 이렇게 흘러가요<img src={mainsectionHoney} alt="꿀" className="inline-block h-8 sm:h-14 w-auto" style={{ verticalAlign: '-0.4em' }} />
          </h2>
          <p className="text-text-brown-2 text-base sm:text-2xl font-bold leading-relaxed sm:leading-loose">
            팀 빌딩부터 기획, 개발 기록, 포트폴리오, 채용 추천까지
            <br />
            프로젝트의 전 과정을 한 번에 연결해요.
          </p>
        </div>

        {/* 캐러셀 */}
        <div className="relative">
          <div ref={carouselRef} className="overflow-visible pt-6 sm:pt-10 pb-4">
            <div
              className="flex items-end transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
              style={{
                transform: visibleCount === 1
                  ? `translateX(${-currentIndex * 100}%)`
                  : `translateX(${(1 - currentIndex) * (100 / VISIBLE_DESKTOP)}%)`,
              }}
            >
              {FLOW_CARDS.map((card, i) => {
                const offsetFromCenter = i - currentIndex;
                const clamped = Math.max(-2, Math.min(2, offsetFromCenter));
                const rotation = visibleCount === 1 ? 0 : clamped * 6;
                const scale = visibleCount === 1
                  ? (clamped === 0 ? 1 : 0.95)
                  : (clamped === 0 ? 1 : 0.88);

                return (
                  <div
                    key={card.title}
                    className={`flex-shrink-0 px-2 sm:px-3 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                      visibleCount === 1 ? 'w-full' : 'w-1/3'
                    }`}
                    style={{
                      transform: `rotate(${rotation}deg) scale(${scale})`,
                      transformOrigin: 'bottom center',
                    }}
                  >
                    <FlowCard {...card} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 모바일 좌우 화살표 */}
          {visibleCount === 1 && (
            <>
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                className={`absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-sm transition-opacity duration-300 ${
                  currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-50 active:opacity-80'
                }`}
                aria-label="이전 카드"
              >
                <svg className="w-5 h-5 text-text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentIndex(prev => Math.min(maxIndex, prev + 1))}
                className={`absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-sm transition-opacity duration-300 ${
                  currentIndex === maxIndex ? 'opacity-0 pointer-events-none' : 'opacity-50 active:opacity-80'
                }`}
                aria-label="다음 카드"
              >
                <svg className="w-5 h-5 text-text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </Container>
    </section>
  );
};

export default FlowSection;
