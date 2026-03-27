import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Info,
  ChevronDown,
  ChevronUp,
  Monitor,
  Server,
  Cloud,
  Bot,
  Database,
  Smartphone,
  X,
  Briefcase,
  PieChart,
  Pen,
} from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { ROLE_LIST, getRoleDisplayName, SKILLS_BY_CATEGORY, SKILL_CATEGORY_META } from '../constants/skills';
import { searchUserByEmail } from '../api/user';
import { inviteUser } from '../api/projects';

/* ── 상수 ── */

const DOMAINS = [
  '웹기술', '웹디자인', '모바일', 'AIoT', '인공지능',
  '빅데이터', '블록체인', '자율주행', '콘텐츠',
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  FRONTEND: Monitor, BACKEND: Server, DEVOPS: Cloud, DATA: PieChart,
  AI: Bot, DATABASE: Database, MOBILE: Smartphone, PM: Briefcase, DESIGN: Pen,
};

const TECH_CATEGORIES = SKILL_CATEGORY_META.map((meta) => ({
  ...meta,
  icon: CATEGORY_ICONS[meta.key] ?? Info,
  stacks: SKILLS_BY_CATEGORY[meta.key] ?? [],
}));


/* ── 타입 ── */

interface Member {
  userId: number;
  userName: string;
  position: string;
  profileImageUrl: string | null;
}

interface VerifiedUser {
  userId: number;
  userName: string;
  profileImageUrl: string | null;
}

interface ProjectFormState {
  name: string;
  description: string;
  domain: string;
  techStacks: Record<string, string[]>;
  members: Member[];
  leaderRole: string;
}

/* ── 컴포넌트 ── */

const CreateProject = () => {
  const navigate = useNavigate();
  const { createProject } = useProjectStore();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ProjectFormState>({
    name: '',
    description: '',
    domain: '',
    techStacks: {},
    members: [],
    leaderRole: '',
  });

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [memberDraft, setMemberDraft] = useState({ email: '', position: '' });
  const [verifiedUser, setVerifiedUser] = useState<VerifiedUser | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [positionOpen, setPositionOpen] = useState(false);
  const positionRef = useRef<HTMLDivElement>(null);
  const positionBtnRef = useRef<HTMLButtonElement>(null);
  const positionListRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (positionRef.current && !positionRef.current.contains(e.target as Node)) {
        setPositionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ── 핸들러 ── */

  const selectDomain = (d: string) =>
    setForm((prev) => ({
      ...prev,
      domain: prev.domain === d ? '' : d,
    }));

  const toggleStack = (category: string, stack: string) =>
    setForm((prev) => {
      const cur = prev.techStacks[category] ?? [];
      return {
        ...prev,
        techStacks: {
          ...prev.techStacks,
          [category]: cur.includes(stack) ? cur.filter((s) => s !== stack) : [...cur, stack],
        },
      };
    });

  const canAddMember = verifiedUser !== null && memberDraft.position !== '';

  const handleVerifyEmail = async () => {
    const email = memberDraft.email.trim();
    if (!email) return;
    setVerifying(true);
    setVerifyError(null);
    setVerifiedUser(null);
    try {
      const result = await searchUserByEmail(email);
      setVerifiedUser(result);
    } catch {
      setVerifyError('해당 이메일로 가입된 사용자가 없습니다.');
    } finally {
      setVerifying(false);
    }
  };

  const addMember = () => {
    if (!canAddMember || !verifiedUser) return;
    if (form.members.some((m) => m.userId === verifiedUser.userId)) {
      setVerifyError('이미 추가된 팀원입니다.');
      return;
    }
    setForm((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        {
          userId: verifiedUser.userId,
          userName: verifiedUser.userName,
          position: memberDraft.position,
          profileImageUrl: verifiedUser.profileImageUrl,
        },
      ],
    }));
    setMemberDraft({ email: '', position: '' });
    setVerifiedUser(null);
    setVerifyError(null);
  };

  const removeMember = (idx: number) =>
    setForm((prev) => ({ ...prev, members: prev.members.filter((_, i) => i !== idx) }));

  const canSubmit = form.name.trim().length > 0 && form.leaderRole !== '' && form.domain !== '' && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const projectId = await createProject({
        title: form.name,
        domain: form.domain,
        description: form.description,
        leaderRole: form.leaderRole,
      });
      if (form.members.length > 0) {
        await Promise.allSettled(
          form.members.map((m) => inviteUser(projectId, m.userId, { role: m.position }))
        );
      }
      navigate(`/my-projects/${projectId}`);
    } catch {
      alert('프로젝트 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── JSX ── */

  return (
    <div style={{ backgroundColor: 'var(--color-background)' }} className="min-h-screen pb-24 sm:pb-28">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col gap-4 sm:gap-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            새 프로젝트 생성
          </h1>
          <p className="text-xs sm:text-base mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
            프로젝트 정보를 입력하고 팀원을 모집하세요
          </p>
        </div>

        {/* ─── 섹션 1: 기본 정보 ─── */}
        <section className="rounded-2xl p-4 sm:p-6 shadow-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="flex items-center gap-2 text-lg font-bold mb-4 sm:mb-5" style={{ color: 'var(--color-text-primary)' }}>
            📋 기본 정보
          </h2>

          {/* 프로젝트명 */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--color-text-primary)' }}>
              프로젝트명 <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              type="text"
              maxLength={90}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="프로젝트 이름을 입력하세요"
              className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
            <p className="text-xs text-right mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {form.name.length}/90
            </p>
          </div>

          {/* 내 직무 선택 */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--color-text-primary)' }}>
              내 직무 <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {ROLE_LIST.map((role) => {
                const selected = form.leaderRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, leaderRole: role }))}
                    className="px-4 py-1.5 rounded-full border text-sm font-medium cursor-pointer transition-colors"
                    style={{
                      borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
                      color: selected ? 'var(--color-primary-hover)' : 'var(--color-text-secondary)',
                      backgroundColor: selected ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                    }}
                  >
                    {getRoleDisplayName(role)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 프로젝트 설명 */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--color-text-primary)' }}>
              프로젝트 설명
            </label>
            <textarea
              maxLength={500}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="프로젝트에 대해 간단히 설명해주세요"
              className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none h-28 resize-none transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
            <p className="text-xs text-right mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              {form.description.length}/500
            </p>
          </div>

          {/* 도메인 선택 */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-1.5 block" style={{ color: 'var(--color-text-primary)' }}>
              도메인 <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DOMAINS.map((d) => {
                const selected = form.domain === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => selectDomain(d)}
                    className="px-4 py-1.5 rounded-full border text-sm font-medium cursor-pointer transition-colors"
                    style={{
                      borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
                      color: selected ? 'var(--color-primary-hover)' : 'var(--color-text-secondary)',
                      backgroundColor: selected ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

        </section>

        {/* ─── 섹션 2: 기술 스택 ─── */}
        <section className="rounded-2xl p-4 sm:p-6 shadow-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="flex items-center gap-2 text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            🛠 기술 스택
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
            프로젝트에서 사용할 기술을 선택하세요
          </p>

          <div className="flex flex-col gap-2">
            {TECH_CATEGORIES.map((cat) => {
              const { key, label, icon: Icon, stacks } = cat;
              const isOpen = openCategory === key;
              const selectedStacks = form.techStacks[key] ?? [];

              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => setOpenCategory(isOpen ? null : key)}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isOpen ? 'var(--color-primary-soft)' : 'var(--color-background)',
                      border: isOpen ? '1px solid var(--color-primary)' : '1px solid transparent',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <Icon className="w-4 h-4" />
                      {label}
                      {selectedStacks.length > 0 && (
                        <span
                          className="text-xs font-normal px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary-hover)' }}
                        >
                          {selectedStacks.length}
                        </span>
                      )}
                    </span>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                      : <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                    }
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-2 flex flex-wrap gap-2">
                      {stacks.map((stack) => {
                        const selected = selectedStacks.includes(stack);
                        return (
                          <button
                            key={stack}
                            type="button"
                            onClick={() => toggleStack(key, stack)}
                            className="px-3 py-1 rounded-full border text-xs font-medium cursor-pointer transition-colors"
                            style={{
                              borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
                              backgroundColor: selected ? 'var(--color-primary-soft)' : 'transparent',
                              color: selected ? 'var(--color-primary-hover)' : 'var(--color-text-secondary)',
                            }}
                          >
                            {stack}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── 섹션 3: 팀원 등록 ─── */}
        <section className="rounded-2xl p-4 sm:p-6 shadow-sm" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="flex items-center gap-2 text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            👥 팀원 등록
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
            함께할 팀원을 등록하세요
          </p>

          {/* 입력 폼 */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--color-primary-soft)' }}>
            {/* 이메일 + 확인 버튼 */}
            <div className="flex gap-2">
              <input
                type="email"
                value={memberDraft.email}
                onChange={(e) => {
                  setMemberDraft((prev) => ({ ...prev, email: e.target.value }));
                  setVerifiedUser(null);
                  setVerifyError(null);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyEmail(); }}
                placeholder="초대할 팀원의 이메일"
                className="flex-1 px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: verifiedUser ? 'var(--color-primary)' : 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                onBlur={(e) => (e.target.style.borderColor = verifiedUser ? 'var(--color-primary)' : 'var(--color-border)')}
              />
              <button
                type="button"
                onClick={handleVerifyEmail}
                disabled={!memberDraft.email.trim() || verifying}
                className="px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  cursor: memberDraft.email.trim() && !verifying ? 'pointer' : 'not-allowed',
                }}
              >
                {verifying ? '확인 중...' : '사용자 확인'}
              </button>
            </div>

            {/* 검증 결과 */}
            {verifiedUser && (
              <div
                className="flex items-center gap-3 mt-3 px-3 py-2.5 rounded-lg"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-primary)' }}
              >
                {verifiedUser.profileImageUrl ? (
                  <img src={verifiedUser.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                    {verifiedUser.userName.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {verifiedUser.userName}
                </span>
                <span className="text-xs ml-auto" style={{ color: 'var(--color-primary)' }}>확인됨</span>
              </div>
            )}
            {verifyError && (
              <p className="text-xs mt-2 px-1" style={{ color: 'var(--color-error)' }}>{verifyError}</p>
            )}

            {/* 포지션 선택 */}
            <div ref={positionRef} className="relative mt-3">
              <button
                ref={positionBtnRef}
                type="button"
                onClick={() => setPositionOpen((prev) => !prev)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPositionOpen((prev) => !prev); }
                  else if (e.key === 'ArrowDown') { e.preventDefault(); setPositionOpen(true); }
                  else if (e.key === 'Escape') { setPositionOpen(false); }
                }}
                aria-haspopup="listbox"
                aria-expanded={positionOpen}
                aria-controls="position-listbox"
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors flex items-center justify-between cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: positionOpen ? 'var(--color-primary)' : 'var(--color-border)',
                  color: memberDraft.position ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                }}
              >
                <span>{memberDraft.position ? getRoleDisplayName(memberDraft.position) : '초대할 포지션 선택'}</span>
                <ChevronDown
                  className="w-4 h-4 transition-transform"
                  style={{ transform: positionOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--color-text-tertiary)' }}
                />
              </button>
              {positionOpen && (
                <ul
                  ref={(node) => { (positionListRef as React.MutableRefObject<HTMLUListElement | null>).current = node; if (node) node.focus(); }}
                  id="position-listbox"
                  role="listbox"
                  tabIndex={-1}
                  onKeyDown={(e) => {
                    const idx = ROLE_LIST.indexOf(memberDraft.position);
                    if (e.key === 'ArrowDown') { e.preventDefault(); setMemberDraft((prev) => ({ ...prev, position: ROLE_LIST[Math.min(idx + 1, ROLE_LIST.length - 1)] })); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setMemberDraft((prev) => ({ ...prev, position: ROLE_LIST[Math.max(idx - 1, 0)] })); }
                    else if (e.key === 'Enter') { e.preventDefault(); setPositionOpen(false); positionBtnRef.current?.focus(); }
                    else if (e.key === 'Escape') { setPositionOpen(false); positionBtnRef.current?.focus(); }
                  }}
                  className="absolute z-50 w-full mt-1 rounded-lg border shadow-lg overflow-hidden"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  {ROLE_LIST.map((role) => (
                    <li
                      key={role}
                      role="option"
                      aria-selected={memberDraft.position === role}
                      onClick={() => { setMemberDraft((prev) => ({ ...prev, position: role })); setPositionOpen(false); }}
                      className="px-4 py-2.5 text-sm cursor-pointer transition-colors"
                      style={{
                        backgroundColor: memberDraft.position === role ? 'var(--color-primary-soft)' : 'transparent',
                        color: memberDraft.position === role ? 'var(--color-primary-hover)' : 'var(--color-text-primary)',
                      }}
                      onMouseEnter={(e) => { if (memberDraft.position !== role) e.currentTarget.style.backgroundColor = 'var(--color-background)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = memberDraft.position === role ? 'var(--color-primary-soft)' : 'transparent'; }}
                    >
                      {getRoleDisplayName(role)}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={addMember}
              disabled={!canAddMember}
              className="w-full py-2.5 rounded-lg border text-sm font-medium mt-3 transition-colors"
              style={{
                backgroundColor: canAddMember ? 'var(--color-primary-soft)' : 'var(--color-border)',
                color: canAddMember ? 'var(--color-primary-hover)' : 'var(--color-text-tertiary)',
                borderColor: canAddMember ? 'var(--color-primary)' : 'var(--color-border)',
                cursor: canAddMember ? 'pointer' : 'not-allowed',
              }}
            >
              + 팀원 추가
            </button>
          </div>

          {/* 팀원 목록 */}
          {form.members.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <span className="text-3xl">👋</span>
              <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                아직 등록된 팀원이 없어요
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-4">
              {form.members.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ backgroundColor: 'var(--color-background)' }}
                >
                  <div className="flex items-center gap-3">
                    {m.profileImageUrl ? (
                      <img src={m.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                        {m.userName.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {m.userName}
                      <span
                        className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary-hover)' }}
                      >
                        {getRoleDisplayName(m.position)}
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(idx)}
                    className="p-1 rounded-full transition-colors"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ─── 하단 고정 CTA ─── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 pt-3"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full max-w-[1400px] mx-auto block py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-bold transition-colors"
          style={{
            backgroundColor: canSubmit ? 'var(--color-primary)' : 'var(--color-border)',
            color: canSubmit ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? '생성 중...' : '프로젝트 생성하기'}
        </button>
      </div>
    </div>
  );
};

export default CreateProject;
