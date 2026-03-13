import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '../common/Container';
import mainsectionHoney from '../../assets/images/mainsection_honey.png';
import cardLogin from '../../assets/images/card_login.png';
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

  return (
    <div
      className="relative rounded-3xl p-6 flex flex-col items-center gap-3 border-4 border-primary-hover transition-all duration-300 hover:scale-105 h-full cursor-pointer overflow-hidden"
      style={{ backgroundColor: '#FFFAEB', boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}
    >
      {/* 가장자리 흐림 오버레이 */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(255,255,255,0.65) 100%)' }}
      />

      {/* STEP 번호 */}
      <span className="self-start text-sm font-bold text-primary-hover tracking-widest">
        STEP {String(step).padStart(2, '0')}
      </span>

      {/* 이미지 영역 */}
      <div className="w-full h-66 flex items-center justify-center">
        {image
          ? <img src={image} alt={title} className="w-full h-full object-contain" />
          : null /* TODO: 각 카드의 image 경로를 FLOW_CARDS에 추가하세요 */
        }
      </div>

      {/* 카드 내용 */}
      <h3 className="text-2xl font-extrabold text-text-brown text-center">{title}</h3>
      <p className="text-base font-bold text-text-brown-2 text-center leading-relaxed flex-1 whitespace-nowrap">{description}</p>

      <button
        onClick={() => navigate(link)}
        className="mt-2 px-12 py-2.5 rounded-xl text-base font-semibold text-text-brown transition-opacity hover:opacity-80"
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
  { step: 1, title: '로그인',       description: '꿀잡에 로그인하고 내 프로필을 등록해요',    link: '/projects',    image: cardLogin          },
  { step: 2, title: '프로젝트 생성', description: '새로운 프로젝트를 만들고 팀원을 초대해요.', link: '/projects',    image: cardCreate         },
  { step: 3, title: '프로젝트 찾기', description: '관심 있는 프로젝트를 찾아 팀에 참여해요',  link: '/projects',    image: cardProject        },
  { step: 4, title: '팀원 찾기',    description: '내 프로젝트에 맞는 팀원을 매칭해요',       link: '/projects',    image: cardMember         },
  { step: 5, title: '프로젝트 관리', description: '진행 중인 프로젝트를 한 곳에서 관리해요',  link: '/projects',    image: cardManagement     },
  { step: 6, title: '트러블 슈팅',  description: '개발 과정에서의 문제와 해결 과정을 기록해요', link: '/recruitment', image: cardTroubleShooting },
  { step: 7, title: '마이페이지',   description: '내 프로젝트와 활동 기록을 한눈에 확인해요', link: '/mypage',      image: cardMypage         },
  { step: 8, title: '채용 공고',    description: '나와 맞는 채용 정보를 추천받아요',         link: '/projects',    image: cardJobmatching    },
];

const VISIBLE = 3;

const FlowSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const maxIndex = FLOW_CARDS.length - 1;
  const sectionRef = useRef<HTMLElement>(null);
  const isScrollingRef = useRef(false);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // 섹션이 뷰포트에 60% 이상 보일 때만 캐러셀 제어
      const rect = el.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      const visibleHeight = Math.min(rect.bottom, viewHeight) - Math.max(rect.top, 0);
      if (visibleHeight < rect.height * 0.6) return;

      const idx = currentIndexRef.current;

      // 쿨다운 중에도 캐러셀 범위 안이면 페이지 스크롤 차단
      if (isScrollingRef.current) {
        if ((e.deltaY > 0 && idx < maxIndex) || (e.deltaY < 0 && idx > 0)) {
          e.preventDefault();
        }
        return;
      }

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

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [maxIndex]);

  return (
    <section ref={sectionRef} className="py-20" style={{ backgroundColor: '#FFFAEB' }}>
      <Container>
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-text-primary mt-8 mb-6">
            <span className="text-6xl text-text-brown">꿀잡</span>은 이렇게 흘러가요<img src={mainsectionHoney} alt="꿀" className="inline-block h-14 w-auto" style={{ verticalAlign: '-0.4em' }} />
          </h2>
          <p className="text-text-brown-2 text-xl font-bold leading-loose">
            팀 빌딩부터 기획, 개발 기록, 포트폴리오, 채용 추천까지
            <br />
            프로젝트의 전 과정을 한 번에 연결해요.
          </p>
        </div>

        {/* 캐러셀 */}
        <div className="overflow-hidden pt-10 pb-4">
          <div
            className="flex items-end transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
            style={{ transform: `translateX(${(1 - currentIndex) * (100 / VISIBLE)}%)` }}
          >
            {FLOW_CARDS.map((card, i) => {
              const offsetFromCenter = i - currentIndex; // -1, 0, 1 for visible
              const clamped = Math.max(-2, Math.min(2, offsetFromCenter));
              const rotation = clamped * 6;
              const scale = clamped === 0 ? 1 : 0.88;

              return (
                <div
                  key={card.title}
                  className="flex-shrink-0 w-1/3 px-3 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
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
      </Container>
    </section>
  );
};

export default FlowSection;
