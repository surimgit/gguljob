import { useState, type FC } from 'react';
import { X } from 'lucide-react';
import Step1Goals from './steps/Step1Goals';
import Step2Role from './steps/Step2Role';
import Step3Experience from './steps/Step3Experience';
import Step4Languages from './steps/Step4Languages';
import Step5MBTI from './steps/Step5MBTI';
import Step6Leadership from './steps/Step6Leadership';
import ProfileCompletePopup from './ProfileCompletePopup';

interface FormData {
  goals: string[];
  role: string;
  experience: string;
  languages: string[];
  mbti: string;
  leaderScore: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (formData: FormData) => void;
}

// Steps 2 & 3 have no progress bar per design spec
const SHOW_PROGRESS = [true, false, false, true, true, true];

const isStepValid = (step: number, formData: FormData): boolean => {
  switch (step) {
    case 1: return formData.goals.length > 0;
    case 2: return formData.role !== '';
    case 3: return formData.experience !== '';
    case 4: return formData.languages.length > 0;
    case 5: return formData.mbti !== '';
    case 6: return true; // leaderScore has default value
    default: return false;
  }
};

const ProfileSetupModal: FC<Props> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    goals: [],
    role: '',
    experience: '',
    languages: [],
    mbti: '',
    leaderScore: 30,
  });
  const [showComplete, setShowComplete] = useState(false);

  if (!isOpen) return null;

  const canNext = isStepValid(step, formData);
  const showProgress = SHOW_PROGRESS[step - 1];

  const handleNext = () => {
    if (!canNext) return;
    if (step < 6) {
      setStep((s) => s + 1);
    } else {
      setShowComplete(true);
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleComplete = () => {
    setShowComplete(false);
    onComplete(formData);
    onClose();
  };

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 40,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: '#FDFBF3',
            borderRadius: 20,
            width: '100%',
            maxWidth: 480,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            pointerEvents: 'auto',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px 0' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              {/* 로고 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>🐝</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>꿀잡</span>
              </div>

              {/* X 버튼 */}
              <button
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1.5px solid #D1D5DB',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#6B7280',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 프로필 설정 레이블 + 스텝 */}
            {showProgress && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                    프로필 설정
                  </span>
                  <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 700 }}>
                    {step}/6
                  </span>
                </div>

                {/* 진행 바 */}
                <div
                  style={{
                    height: 5,
                    borderRadius: 999,
                    background: '#E5E7EB',
                    marginBottom: 24,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(step / 6) * 100}%`,
                      background: '#F59E0B',
                      borderRadius: 999,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </>
            )}

            {/* Step 2, 3 : 헤더 하단 여백만 */}
            {!showProgress && <div style={{ height: 8 }} />}
          </div>

          {/* Step Content */}
          <div style={{ padding: '0 24px 24px', overflowY: 'auto', maxHeight: '55vh' }}>
            {step === 1 && (
              <Step1Goals
                selected={formData.goals}
                onChange={(v) => update('goals', v)}
              />
            )}
            {step === 2 && (
              <Step2Role
                selected={formData.role}
                onChange={(v) => update('role', v)}
              />
            )}
            {step === 3 && (
              <Step3Experience
                selected={formData.experience}
                onChange={(v) => update('experience', v)}
              />
            )}
            {step === 4 && (
              <Step4Languages
                selected={formData.languages}
                onChange={(v) => update('languages', v)}
              />
            )}
            {step === 5 && (
              <Step5MBTI
                selected={formData.mbti}
                onChange={(v) => update('mbti', v)}
              />
            )}
            {step === 6 && (
              <Step6Leadership
                value={formData.leaderScore}
                onChange={(v) => update('leaderScore', v)}
              />
            )}
          </div>

          {/* Footer Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '12px 24px 24px',
              borderTop: '1px solid #E8DFB8',
            }}
          >
            {step > 1 && (
              <button
                onClick={handlePrev}
                style={{
                  flex: 1,
                  padding: '13px 0',
                  borderRadius: 12,
                  border: '1.5px solid #D1D5DB',
                  background: 'transparent',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                이전
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canNext}
              style={{
                flex: step === 1 ? 1 : 2,
                padding: '13px 0',
                borderRadius: 12,
                border: 'none',
                background: canNext ? '#F59E0B' : '#E5E7EB',
                fontSize: 15,
                fontWeight: 700,
                color: canNext ? '#FFFFFF' : '#9CA3AF',
                cursor: canNext ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (canNext) e.currentTarget.style.background = '#D97706';
              }}
              onMouseLeave={(e) => {
                if (canNext) e.currentTarget.style.background = '#F59E0B';
              }}
            >
              {step === 6 ? '완료' : '다음'}
            </button>
          </div>
        </div>
      </div>

      {/* 완료 팝업 */}
      {showComplete && (
        <ProfileCompletePopup formData={formData} onClose={handleComplete} />
      )}
    </>
  );
};

export default ProfileSetupModal;
