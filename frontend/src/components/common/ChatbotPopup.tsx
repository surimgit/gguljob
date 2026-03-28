import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, ChevronLeft } from 'lucide-react';
import chatbotImg from '../../assets/images/chatbot.png';

// ── 타입 ──────────────────────────────────────────────────────────────────────
export interface ChatbotMrItem {
  id: number;
  title: string;
}

interface ChatbotPopupProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'agent' | 'troubleshooting';
  // 트러블슈팅 모드 전용
  mrList?: ChatbotMrItem[];
  selectedMrId?: number | null;
  onMrSelect?: (id: number) => void;
  onGenerate?: (mrId: number) => Promise<void>;
  // 에이전트 모드 전용
  onSendMessage?: (message: string) => void;
}

// ── 챗봇 팝업 컴포넌트 ───────────────────────────────────────────────────────
const ChatbotPopup = ({
  isOpen,
  onClose,
  mode,
  mrList = [],
  selectedMrId = null,
  onMrSelect,
  onGenerate,
  onSendMessage,
}: ChatbotPopupProps) => {
  const [generating, setGenerating] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setGenerating(false);
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // 팝업이 닫힐 때 generating 초기화
  useEffect(() => {
    if (!isOpen) setGenerating(false);
  }, [isOpen]);

  const isAgent = mode === 'agent';
  const title = isAgent ? '꿀잡 에이전트' : 'AI 트러블슈팅 자동 생성';
  const generatingTitle = isAgent ? '답변 생성 중...' : '트러블슈팅 생성 중...';
  const generatingSubtitle = isAgent ? '질문을 분석하고 있습니다' : 'MR 리뷰를 분석하고 있습니다';

  const handleClose = () => {
    setGenerating(false);
    onClose();
  };

  return (
    <div
      ref={popupRef}
      className="fixed bottom-15 right-44 w-[450px] z-50 rounded-2xl border border-[#c7d2fe] overflow-hidden shadow-2xl flex flex-col"
      style={{
        background: '#f5f7ff',
        minHeight: generating ? (isAgent ? 360 : 420) : undefined,
        display: isOpen ? 'flex' : 'none',
      }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-[#c7d2fe]"
        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-base font-bold text-white">{title}</span>
          <span className="text-[10px] font-bold tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full">
            Beta
          </span>
        </div>
        <button
          onClick={handleClose}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 본문 */}
      {generating ? (
        <div className="relative px-6 py-8 flex-1 flex flex-col items-center justify-center gap-3">
          <button
            onClick={() => setGenerating(false)}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-[#f3f4f6] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div
            className={`overflow-hidden flex-shrink-0 ${
              isAgent ? 'w-24 h-24' : 'w-36 h-36'
            }`}
          >
            <img src={chatbotImg} alt="AI" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span
              className={`font-bold text-text-primary ${
                isAgent ? 'text-lg' : 'text-xl'
              }`}
            >
              {generatingTitle}
            </span>
            <span
              className={`text-text-secondary ${isAgent ? 'text-sm' : 'text-base'}`}
            >
              {generatingSubtitle}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`rounded-full bg-[#6366f1] animate-pulse ${
                isAgent ? 'w-2 h-2' : 'w-2.5 h-2.5'
              }`}
              style={{ animationDelay: '0ms' }}
            />
            <span
              className={`rounded-full bg-[#6366f1] animate-pulse ${
                isAgent ? 'w-2 h-2' : 'w-2.5 h-2.5'
              }`}
              style={{ animationDelay: '300ms' }}
            />
            <span
              className={`rounded-full bg-[#6366f1] animate-pulse ${
                isAgent ? 'w-2 h-2' : 'w-2.5 h-2.5'
              }`}
              style={{ animationDelay: '600ms' }}
            />
          </div>
        </div>
      ) : (
        <div className="px-6 pt-7 pb-6 flex-1 flex flex-col gap-5">
          {/* 인사 말풍선 */}
          <div className="flex items-start gap-0.5">
            <div className="w-20 h-14 overflow-hidden flex-shrink-0">
              <img src={chatbotImg} alt="AI" className="w-full h-full object-cover" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-4 border border-border">
              <p className="text-sm text-text-secondary leading-relaxed">
                {isAgent ? (
                  <>
                    프로젝트 구현 중 막히는 부분이 있으신가요?
                    <br />꿀잡 에이전트가 해결 방법을 찾아드립니다.
                  </>
                ) : (
                  <>
                    MR 리뷰를 AI가 분석하여 트러블슈팅 초안을 자동으로 생성합니다.
                    <br />생성 후 직접 수정 · 보완하여 포트폴리오로 활용할 수 있습니다.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* 트러블슈팅 모드: MR 리스트 */}
          {!isAgent && mrList.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-text-primary">MR 리뷰</span>
              <div
                className="flex flex-col gap-1.5 overflow-y-auto"
                style={{ maxHeight: Math.min(mrList.length, 4) * 46 }}
              >
                {mrList.map((mr) => (
                  <label
                    key={mr.id}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors border flex-shrink-0 ${
                      selectedMrId === mr.id
                        ? 'bg-[#eef2ff] border-[#c7d2fe]'
                        : 'bg-white border-border hover:bg-[#f9fafb]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mr-select"
                      checked={selectedMrId === mr.id}
                      onChange={() => onMrSelect?.(mr.id)}
                      className="accent-[#6366f1] w-4 h-4 flex-shrink-0"
                    />
                    <span className="text-sm text-text-secondary truncate">
                      {mr.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 입력 영역 */}
          <div className="mt-auto flex items-end gap-2">
            {isAgent ? (
              <textarea
                rows={1}
                placeholder="구현 중 막히는 부분을 입력하세요..."
                className="flex-1 px-4 py-3 rounded-xl text-sm border border-border bg-white outline-none focus:border-[#6366f1] transition-colors resize-none"
                style={{ maxHeight: 120, overflowY: 'auto' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const value = e.currentTarget.value.trim();
                    if (value) {
                      onSendMessage?.(value);
                      e.currentTarget.value = '';
                      e.currentTarget.style.height = 'auto';
                      setGenerating(true);
                    }
                  }
                }}
              />
            ) : (
              <input
                type="text"
                placeholder="트러블슈팅으로 생성할 MR을 선택하세요"
                readOnly
                value={
                  selectedMrId
                    ? mrList.find((mr) => mr.id === selectedMrId)?.title ?? ''
                    : ''
                }
                className="flex-1 px-4 py-3 rounded-xl text-sm border border-border bg-white outline-none focus:border-[#6366f1] transition-colors truncate"
              />
            )}
            <button
              onClick={async () => {
                if (isAgent) {
                  setGenerating(true);
                } else {
                  if (!selectedMrId) return;
                  setGenerating(true);
                  try {
                    await onGenerate?.(selectedMrId);
                  } catch (err) {
                    console.error('트러블슈팅 생성 실패:', err);
                    setGenerating(false);
                  }
                }
              }}
              disabled={!isAgent && mrList.length > 0 && selectedMrId === null}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition-opacity hover:opacity-90 border-0 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotPopup;
