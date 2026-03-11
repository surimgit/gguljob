import { type FC } from 'react';
import { CheckCircle } from 'lucide-react';
import { getLeaderType } from './utils/leaderUtils';

interface FormData {
  goals: string[];
  role: string;
  experience: string;
  languages: string[];
  mbti: string;
  leaderScore: number;
}

interface Props {
  formData: FormData;
  onClose: () => void;
}

const GOAL_LABELS: Record<string, string> = {
  'side-project': '사이드 프로젝트',
  portfolio: '포트폴리오',
  study: '스터디',
  startup: '창업 준비',
  competition: '공모전',
  job: '취업 준비',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: '입문',
  junior: '초급',
  mid: '중급',
  senior: '고급',
};

const TAG_COLORS = [
  'border-primary text-amber-800 bg-amber-50',
  'border-green-400 text-green-800 bg-green-50',
  'border-blue-400 text-blue-800 bg-blue-50',
  'border-pink-400 text-pink-800 bg-pink-50',
];

const ProfileCompletePopup: FC<Props> = ({ formData, onClose }) => {
  const tags = [
    formData.goals.length > 0 ? (GOAL_LABELS[formData.goals[0]] ?? formData.goals[0]) : null,
    formData.experience ? (EXPERIENCE_LABELS[formData.experience] ?? formData.experience) : null,
    formData.mbti || null,
    formData.mbti ? getLeaderType(formData.leaderScore).label : null,
  ].filter(Boolean) as string[];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-[20px] w-full max-w-[400px] overflow-hidden shadow-2xl">
        {/* 무지개 그라데이션 바 */}
        <div
          className="h-1.5"
          style={{
            background: 'linear-gradient(to right, #FF6B6B, #FF9F43, #F7D800, #6BCB77, #4DA8DA, #845EC2)',
          }}
        />

        <div className="px-7 pt-8 pb-7 text-center">
          {/* 체크 아이콘 */}
          <div className="w-18 h-18 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5"
            style={{ width: 72, height: 72 }}>
            <CheckCircle size={40} className="text-green-500" strokeWidth={2} />
          </div>

          <p className="text-xl font-bold text-gray-900 mb-2.5">프로필 설정 완료!</p>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            입력하신 정보를 바탕으로<br />
            딱 맞는 프로젝트와 팀원을 추천해드릴게요
          </p>

          {/* 태그 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-7">
              {tags.map((tag, i) => (
                <span
                  key={tag}
                  className={`py-1.5 px-3.5 rounded-full border-[1.5px] text-[13px] font-semibold ${TAG_COLORS[i % TAG_COLORS.length]}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl border-none bg-primary text-white text-base font-bold cursor-pointer hover:bg-amber-600 transition-colors duration-150"
          >
            메인페이지로
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletePopup;
