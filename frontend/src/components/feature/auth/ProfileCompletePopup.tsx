import { type FC } from 'react';
import { CheckCircle } from 'lucide-react';

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

const getLeaderLabel = (score: number) => {
  if (score <= 20) return '팔로워형';
  if (score <= 40) return '팔로워 성향';
  if (score <= 60) return '밸런스형';
  if (score <= 80) return '리더 성향';
  return '리더형';
};

const TAG_COLORS = [
  { border: '#F59E0B', bg: '#FFFBEA', color: '#92400E' },
  { border: '#34D399', bg: '#ECFDF5', color: '#065F46' },
  { border: '#60A5FA', bg: '#EFF6FF', color: '#1E40AF' },
  { border: '#F472B6', bg: '#FDF2F8', color: '#831843' },
];

const ProfileCompletePopup: FC<Props> = ({ formData, onClose }) => {
  const tags = [
    ...(formData.goals.length > 0
      ? [GOAL_LABELS[formData.goals[0]] || formData.goals[0]]
      : []),
    formData.experience ? EXPERIENCE_LABELS[formData.experience] || formData.experience : null,
    formData.mbti || null,
    formData.mbti ? getLeaderLabel(formData.leaderScore) : null,
  ].filter(Boolean) as string[];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        background: 'rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          width: '100%',
          maxWidth: 400,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* 무지개 그라데이션 바 */}
        <div
          style={{
            height: 6,
            background:
              'linear-gradient(to right, #FF6B6B, #FF9F43, #F7D800, #6BCB77, #4DA8DA, #845EC2)',
          }}
        />

        <div style={{ padding: '32px 28px 28px', textAlign: 'center' }}>
          {/* 체크 아이콘 */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <CheckCircle size={40} color="#22C55E" strokeWidth={2} />
          </div>

          {/* 타이틀 */}
          <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
            프로필 설정 완료!
          </p>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>
            입력하신 정보를 바탕으로
            <br />
            딱 맞는 프로젝트와 팀원을 추천해드릴게요
          </p>

          {/* 태그 줄 */}
          {tags.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                justifyContent: 'center',
                marginBottom: 28,
              }}
            >
              {tags.map((tag, i) => {
                const c = TAG_COLORS[i % TAG_COLORS.length];
                return (
                  <span
                    key={tag}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 999,
                      border: `1.5px solid ${c.border}`,
                      background: c.bg,
                      color: c.color,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}

          {/* CTA 버튼 */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              border: 'none',
              background: '#F59E0B',
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#D97706')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#F59E0B')}
          >
            메인페이지로
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletePopup;
