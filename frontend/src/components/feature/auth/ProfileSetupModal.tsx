import { useState, useEffect, type FC } from "react";
import { X } from "lucide-react";
import gguljobLogo from "../../../assets/images/gguljob_logo.png";
import Step1Goals from "./steps/Step1Goals";
import Step2Role from "./steps/Step2Role";
import Step3Experience from "./steps/Step3Experience";
import Step4Languages from "./steps/Step4Languages";
import Step5MBTI from "./steps/Step5MBTI";
import Step6Leadership from "./steps/Step6Leadership";
import ProfileCompletePopup from "./ProfileCompletePopup";
import ProfileEditCompletePopup from "./ProfileEditCompletePopup";

interface FormData {
  goals: string[];
  position: string;
  experience: string;
  skills: string[];
  mbti: string;
  leaderScore: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (formData: FormData) => void;
  initialData?: Partial<FormData>;
  /** 'onboarding' = 최초 가입, 'edit' = 마이페이지 정보수정 */
  mode?: 'onboarding' | 'edit';
}

const SHOW_PROGRESS = [true, true, true, true, true, true];

const isStepValid = (step: number, formData: FormData): boolean => {
  switch (step) {
    case 1:
      return formData.goals.length > 0;
    case 2:
      return formData.position !== "";
    case 3:
      return formData.experience !== "";
    case 4:
      return formData.skills.length > 0;
    case 5:
      return formData.mbti !== "";
    case 6:
      return true;
    default:
      return false;
  }
};

const DEFAULT_FORM: FormData = {
  goals: [],
  position: "",
  experience: "",
  skills: [],
  mbti: "",
  leaderScore: 30,
};

const ProfileSetupModal: FC<Props> = ({ isOpen, onClose, onComplete, initialData, mode = 'onboarding' }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({ ...DEFAULT_FORM, ...initialData });
  const [showComplete, setShowComplete] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  // 모달이 열릴 때마다 initialData로 동기화
  useEffect(() => {
    if (isOpen) {
      setFormData({ ...DEFAULT_FORM, ...initialData });
      setStep(1);
      setShowComplete(false);
      setShowExitWarning(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleExit = () => setShowExitWarning(true);

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
  };

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      {/* Backdrop — 이탈 경고 */}
      <div onClick={handleExit} className="fixed inset-0 bg-black/45 z-40" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="bg-surface rounded-[20px] w-full max-w-[620px] shadow-2xl pointer-events-auto overflow-hidden flex flex-col h-[620px]">
          {/* Header */}
          <div className="px-6 pt-3 flex-shrink-0">
            {/* 로고 + X 버튼 */}
            <div className="flex items-center justify-between mb-2">
              <img
                src={gguljobLogo}
                alt="꿀잡"
                className="h-18 object-contain"
              />
              <button
                onClick={handleExit}
                className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 진행 바 영역 — 항상 동일한 높이 유지, 미표시 시 invisible */}
            <div className={showProgress ? "" : "invisible"}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[13px] text-gray-500 font-medium">
                  프로필 설정
                </span>
                <span className="text-[13px] text-primary font-bold">
                  {step}/6
                </span>
              </div>
              <div className="h-[5px] rounded-full bg-gray-200 mb-6 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${(step / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="pl-5 pr-4 pb-6 flex-1 overflow-y-auto">
            {step === 1 && (
              <Step1Goals
                selected={formData.goals}
                onChange={(v) => update("goals", v)}
              />
            )}
            {step === 2 && (
              <Step2Role
                selected={formData.position}
                onChange={(v) => update("position", v)}
              />
            )}
            {step === 3 && (
              <Step3Experience
                selected={formData.experience}
                onChange={(v) => update("experience", v)}
              />
            )}
            {step === 4 && (
              <Step4Languages
                selected={formData.skills}
                onChange={(v) => update("skills", v)}
              />
            )}
            {step === 5 && (
              <Step5MBTI
                selected={formData.mbti}
                onChange={(v) => update("mbti", v)}
              />
            )}
            {step === 6 && (
              <Step6Leadership
                value={formData.leaderScore}
                onChange={(v) => update("leaderScore", v)}
              />
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-2.5 pl-6 pr-9 pt-3 pb-6 flex-shrink-0">
            {step > 1 && (
              <button
                onClick={handlePrev}
                className="flex-2 py-3.5 rounded-xl border border-gray-300 bg-transparent text-[15px] font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors duration-150"
              >
                이전
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canNext}
              className={`py-3.5 rounded-xl border-none text-[15px] font-bold transition-colors duration-150
                ${step === 1 ? "flex-1" : "flex-[2]"}
                ${
                  canNext
                    ? "bg-primary text-white cursor-pointer hover:bg-amber-600"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
            >
              {step === 6 ? "완료" : "다음"}
            </button>
          </div>
        </div>
      </div>

      {showComplete && (
        mode === 'edit'
          ? <ProfileEditCompletePopup onClose={handleComplete} />
          : <ProfileCompletePopup formData={formData} onClose={handleComplete} />
      )}

      {/* 이탈 경고 모달 */}
      {showExitWarning && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" />
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 pointer-events-none">
            <div className="bg-white rounded-2xl w-full max-w-[380px] p-6 shadow-2xl pointer-events-auto text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                프로필 설정을 완료해주세요
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                프로필 설정을 완료하지 않으면 서비스를 이용할 수 없습니다.<br />
                지금 나가시면 로그아웃됩니다.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowExitWarning(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  계속 설정하기
                </button>
                <button
                  onClick={() => {
                    setShowExitWarning(false);
                    onClose();
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
                >
                  나가기
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ProfileSetupModal;
