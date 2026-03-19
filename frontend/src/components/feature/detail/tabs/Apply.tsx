import { useState, useEffect } from 'react';
import { getTeamManagement, applyToPosition } from '../../../../api/projects';
import type { RecruitmentStatus } from '../../../../types/project';
import { useAuthStore } from '../../../../stores/authStore';

interface ApplyProps {
  projectId: number;
}

const ROLE_LABEL: Record<string, string> = {
  FE: '프론트엔드',
  BE: '백엔드',
  AI: '데이터/AI',
  PM: '기획/PM',
  INFRA: '인프라/DevOps',
  DESIGN: '디자인',
};

const ROLE_COLOR: Record<string, string> = {
  FE: '#2196F3',
  BE: '#22C55E',
  AI: '#EC4899',
  PM: '#F59E0B',
  INFRA: '#7C3AED',
  DESIGN: '#d22ab6',
};

const MAX_APPEAL_LENGTH = 200;

const Apply = ({ projectId }: ApplyProps) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [positions, setPositions] = useState<RecruitmentStatus[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [appeal, setAppeal] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    getTeamManagement(projectId)
      .then(({ data }) => {
        const mgmt = data.data ?? data;
        setPositions(mgmt.recruitments.filter((r) => r.status === 'RECRUITING'));
      })
      .catch((err) => {
        console.error('[지원하기] 포지션 조회 실패:', err);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleApply = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    setResult(null);
    try {
      await applyToPosition(projectId, selectedId, appeal || undefined);
      setResult('success');
      setSelectedId(null);
      setAppeal('');
    } catch (err: unknown) {
      console.error('[지원하기] 신청 실패:', err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? '지원에 실패했습니다. 다시 시도해주세요.';
      setErrorMsg(msg);
      setResult('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <p className="text-text-secondary text-[15px] font-medium">로그인 후 지원할 수 있습니다</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <p className="text-text-secondary text-[15px] font-medium">현재 모집 중인 포지션이 없습니다</p>
      </div>
    );
  }

  // 지원 성공 화면
  if (result === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 rounded-full bg-[#e8f5e8] flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p className="text-[17px] font-black text-text-primary">지원이 완료되었습니다!</p>
        <p className="text-[13px] text-text-tertiary">팀 리더의 수락을 기다려주세요.</p>
      </div>
    );
  }

  const totalOpen = positions.reduce((sum, p) => sum + (p.targetCount - p.currentCount), 0);

  return (
    <div>
      {/* 모집 요약 */}
      <div className="flex items-center justify-between bg-primary-soft rounded-xl px-5 py-3.5 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[18px]">📢</span>
          <span className="text-[14px] font-bold text-text-primary">
            총 <span className="font-black text-primary-hover">{totalOpen}명</span> 모집중
          </span>
        </div>
        <span className="text-[13px] text-text-tertiary font-bold">
          {selectedId ? '포지션이 선택되었습니다' : '포지션을 선택하세요'}
        </span>
      </div>

      {/* 에러 메시지 */}
      {result === 'error' && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-[13px] text-red-600 font-bold">{errorMsg}</p>
        </div>
      )}

      {/* 포지션 카드 목록 */}
      <div className="flex flex-col gap-4">
        {positions.map((pos) => {
          const openSlots = pos.targetCount - pos.currentCount;
          const progress = pos.targetCount > 0 ? pos.currentCount / pos.targetCount : 0;
          const color = ROLE_COLOR[pos.role] ?? '#6b7280';
          const isSelected = selectedId === pos.positionId;

          return (
            <div
              key={pos.positionId}
              onClick={() => setSelectedId(pos.positionId)}
              className={`rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                isSelected ? 'border-primary bg-[#FFFDF5]' : 'border-dashed border-border bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-text-primary text-[16px]">
                  {ROLE_LABEL[pos.role] ?? pos.role}
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="bg-primary-soft text-text-brown font-bold text-[13px] px-3 py-1 rounded-lg">
                    {openSlots}명 모집
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? 'border-primary bg-primary' : 'border-[#d1d5db] bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              <p className="text-text-tertiary text-[13px] font-bold mt-1.5">
                {pos.currentCount}/{pos.targetCount}명 충원
              </p>

              <div className="mt-2.5 h-1.5 rounded-full bg-[#e5e7eb] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress * 100}%`, background: `linear-gradient(to right, ${color}, #F7C948)` }}
                />
              </div>

              {pos.requireSkills.length > 0 && (
                <div className="mt-4 bg-[#f7f8fa] rounded-xl px-4 py-3.5">
                  <p className="text-[12px] text-text-tertiary font-bold mb-1">요구 스택/기술</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pos.requireSkills.map((skill) => (
                      <span key={skill} className="text-[12px] font-bold text-text-secondary bg-white px-2.5 py-1 rounded-lg border border-border">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 자기소개 */}
      <div className="mt-6">
        <label className="block text-[14px] font-black text-text-primary mb-2">자기소개</label>
        <textarea
          value={appeal}
          onChange={(e) => {
            if (e.target.value.length <= MAX_APPEAL_LENGTH) setAppeal(e.target.value);
          }}
          placeholder="본인을 간략하게 소개해 주세요"
          rows={3}
          className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none resize-none transition-colors"
        />
        <p className="text-[12px] text-text-tertiary text-right mt-1">
          {appeal.length}/{MAX_APPEAL_LENGTH}
        </p>
      </div>

      {/* 지원 버튼 */}
      <button
        disabled={!selectedId || submitting}
        onClick={handleApply}
        className={`w-full mt-6 py-4 rounded-2xl font-black text-[15px] transition-all ${
          selectedId && !submitting
            ? 'bg-primary text-text-primary hover:bg-primary-hover shadow-[0px_4px_12px_0px_rgba(247,201,72,0.4)]'
            : 'bg-[#e5e7eb] text-text-tertiary cursor-not-allowed'
        }`}
      >
        {submitting ? '지원 중...' : selectedId ? '지원하기' : '포지션을 선택해 주세요'}
      </button>
    </div>
  );
};

export default Apply;
