import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  ChevronDown,
  Plus,
  Minus,
  UserPlus,
  UserRound,
  X,
  Check,
  Crown,
} from "lucide-react";
import type { TeamDashboard, TeamManagement as TeamManagementData } from "../../../../types/project";
import { acceptRequest, rejectRequest, getTeamManagement, removeMember, delegateLeader, createRecruitment, updateRecruitmentStatus, updateRecruitmentTargetCount, deleteRecruitment, getGitHubContributors } from "../../../../api/projects";
import { useAuthStore } from "../../../../stores/authStore";
import { ROLE_STACKS, ROLE_LIST, getRoleColor, getRoleDisplayName, DISPLAY_TO_ROLE } from "../../../../constants/skills";
import type { RoleCode } from "../../../../constants/skills";
import UserProfileModal from "../../mypage/UserProfileModal";
import TeamInviteModal from "../../team-recommend/TeamInviteModal";

/* ── 타입 ── */
type RoleStatus = "open" | "paused" | "closed";

interface Role {
  id: string;
  name: string;
  status: RoleStatus;
  current: number;
  total: number;
  stacks: string[];
}

interface Member {
  id: string;
  name: string;
  role: string;
  joinDate: string;
  contribution: number;
  isLeader?: boolean;
  isMe?: boolean;
  profileImageUrl?: string | null;
}

interface Application {
  id: string;
  name: string;
  role: string;
  appliedAt: string;
  stacks: string[];
  status: "pending" | "accepted" | "rejected";
  profileImageUrl?: string | null;
}

interface TeamManagementProps {
  projectName: string;
  projectId?: number;
  roles: Role[];
  members: Member[];
  applications: Application[];
  onLeaderDelegated?: () => void;
  onRefresh?: () => void;
}


/* ── 아바타 색상 (해시 기반) ── */
const AVATAR_COLORS = [
  "#2196F3", "#22C55E", "#EC4899", "#7C3AED",
  "#F59E0B", "#EF4444", "#14B8A6", "#F97316",
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};



// TODO: 백엔드에 팀원 개별 조회/포지션 상세/합류 신청 API 추가 후 교체 필요
// 현재는 roleCounts(역할별 인원 수)만으로 임시 변환
const dashboardToRoles = (dashboard: TeamDashboard): Role[] => {
  const { roleCounts } = dashboard.teamStats;
  if (!roleCounts) return [];
  return Object.entries(roleCounts).map(([code, count], idx) => {
    return {
      id: `role-${idx}`,
      name: getRoleDisplayName(code),
      // TODO: 포지션 API에서 targetCount, status, requireSkills 조회로 교체
      status: (count > 0 ? "closed" : "open") as RoleStatus,
      current: count,
      total: Math.max(count, 1),
      stacks: [],
    };
  });
};

const dashboardToMembers = (dashboard: TeamDashboard): Member[] => {
  const { roleCounts } = dashboard.teamStats;
  if (!roleCounts) return [];
  const members: Member[] = [];
  // TODO: 팀원 목록 API에서 실제 이름/가입일/기여도 조회로 교체
  Object.entries(roleCounts).forEach(([code, count]) => {
    for (let i = 0; i < count; i++) {
      members.push({
        id: `${code}-${i}`,
        name: `${getRoleDisplayName(code)} ${i + 1}`,
        role: getRoleDisplayName(code),
        joinDate: "-",
        contribution: 0,
        isLeader: members.length === 0,
        isMe: members.length === 0,
      });
    }
  });
  return members;
};

/* ── 상태 드롭다운 설정 ── */
const STATUS_OPTIONS: {
  key: RoleStatus;
  label: string;
  dotColor: string;
  textColor: string;
  activeBg: string;
}[] = [
  {
    key: "open",
    label: "모집 중",
    dotColor: "var(--color-blue)",
    textColor: "var(--color-blue)",
    activeBg: "rgba(33,150,243,0.15)",
  },
  {
    key: "paused",
    label: "일시 중단",
    dotColor: "var(--color-primary-hover)",
    textColor: "var(--color-primary-hover)",
    activeBg: "var(--color-primary-soft)",
  },
  {
    key: "closed",
    label: "모집 마감",
    dotColor: "var(--color-error)",
    textColor: "var(--color-error)",
    activeBg: "rgba(239,68,68,0.23)",
  },
];

const getStatusConfig = (status: RoleStatus) =>
  STATUS_OPTIONS.find((o) => o.key === status) ?? STATUS_OPTIONS[0];

/* ── 상태 뱃지 스타일 ── */
const getBadgeStyle = (status: RoleStatus) => {
  const cfg = getStatusConfig(status);
  return {
    background: cfg.activeBg,
    border: `1px solid ${cfg.dotColor}`,
    color: cfg.textColor,
  };
};

/* ══════════════════════════════════════
   모집 상태 드롭다운
   ════════════════════════════��═════════ */
const StatusDropdown = ({
  roleId,
  currentStatus,
  onSelect,
}: {
  roleId: string;
  currentStatus: RoleStatus;
  onSelect: (roleId: string, status: RoleStatus) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const cfg = getStatusConfig(currentStatus);

  return (
    <div className="relative" ref={ref}>
      {/* 뱃지 버튼 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer"
        style={getBadgeStyle(currentStatus)}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: cfg.dotColor }}
        />
        {cfg.label}
        <ChevronDown className="w-3 h-3" />
      </button>

      {/* 드롭다운 */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-[148px] rounded-[12px] overflow-hidden z-50"
          style={{
            background: "var(--color-surface)",
            boxShadow: "0px 8px 24px 0px rgba(0,0,0,0.12)",
          }}
        >
          {STATUS_OPTIONS.map((opt, idx) => {
            const isSelected = opt.key === currentStatus;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  onSelect(roleId, opt.key);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-[12.5px] cursor-pointer"
                style={{
                  background: isSelected ? opt.activeBg : "var(--color-surface)",
                  borderBottom:
                    idx < STATUS_OPTIONS.length - 1
                      ? "1px solid var(--color-border)"
                      : "none",
                  color: opt.textColor,
                  fontWeight: isSelected ? 700 : 400,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: opt.dotColor }}
                />
                <span className="flex-1 text-left">{opt.label}</span>
                {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════
   팀원 모집하기 모달 (RecruitModal)
   ══════════════════════════════════════ */


interface RecruitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { role: RoleCode; count: number; stacks: string[] }) => void;
  addedRoles?: RoleCode[];
}

const RecruitModal = ({ isOpen, onClose, onConfirm, addedRoles = [] }: RecruitModalProps) => {
  const [selectedRole, setSelectedRole] = useState<RoleCode | null>(null);
  const [count, setCount] = useState(1);
  const [stackInput, setStackInput] = useState("");
  const [stacks, setStacks] = useState<string[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [listPos, setListPos] = useState({ top: 0, left: 0, width: 0 });

  const handleSelectRole = (role: RoleCode) => {
    setSelectedRole(role);
    setStacks([]);
    setStackInput("");
    setHighlightIdx(-1);
  };

  // 리스트박스 위치를 input 기준으로 계산
  const updateListPos = () => {
    if (inputWrapRef.current) {
      const rect = inputWrapRef.current.getBoundingClientRect();
      setListPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  };

  if (!isOpen) return null;

  const allSuggestions = selectedRole ? (ROLE_STACKS[selectedRole] ?? []) : [];
  const quickTags = allSuggestions.filter((s) => !stacks.includes(s));
  const filtered = allSuggestions.filter(
    (s) => !stacks.includes(s) && s.toLowerCase().includes(stackInput.toLowerCase()),
  );

  const addStack = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !stacks.includes(trimmed)) {
      setStacks((prev) => [...prev, trimmed]);
    }
  };

  const selectSuggestion = (value: string) => {
    addStack(value);
    setStackInput("");
    setHighlightIdx(-1);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const scrollToItem = (idx: number) => {
    if (!listRef.current) return;
    const items = listRef.current.children;
    if (items[idx]) {
      (items[idx] as HTMLElement).scrollIntoView({ block: "nearest" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = highlightIdx < filtered.length - 1 ? highlightIdx + 1 : 0;
        setHighlightIdx(next);
        scrollToItem(next);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const next = highlightIdx > 0 ? highlightIdx - 1 : filtered.length - 1;
        setHighlightIdx(next);
        scrollToItem(next);
        return;
      }
      if (e.key === "Enter" && highlightIdx >= 0) {
        e.preventDefault();
        selectSuggestion(filtered[highlightIdx]);
        return;
      }
    }
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (stackInput.trim()) {
        addStack(stackInput);
        setStackInput("");
        setHighlightIdx(-1);
      }
    } else if (e.key === "Backspace" && !stackInput && stacks.length > 0) {
      setStacks((prev) => prev.slice(0, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightIdx(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(",")) {
      val.split(",").forEach((s) => addStack(s));
      setStackInput("");
    } else {
      setStackInput(val);
      setShowSuggestions(true);
      setHighlightIdx(-1);
      updateListPos();
    }
  };

  const handleInputFocus = () => {
    if (stackInput) {
      setShowSuggestions(true);
    }
    updateListPos();
  };

  const canConfirm = selectedRole !== null && stacks.length > 0;

  const handleConfirm = () => {
    if (!canConfirm || !selectedRole) return;
    onConfirm({ role: selectedRole, count, stacks });
    // reset
    setSelectedRole(null);
    setCount(1);
    setStackInput("");
    setStacks([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-[500px] rounded-[18px]"
        style={{
          background: "var(--color-background)",
          boxShadow: "0px 24px 60px 0px rgba(0,0,0,0.18)",
        }}
      >
        {/* 상단 바 */}
        <div className="h-11 bg-primary w-full relative flex items-center justify-end px-5" style={{ borderRadius: "18px 18px 0 0" }}>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 pt-5 pb-6 max-h-[70vh] overflow-y-auto">
          {/* 타이틀 */}
          <h3
            className="text-[20px] font-bold mb-0.5"
            style={{ color: "var(--color-text-primary)" }}
          >
            모집할 직무 추가하기
          </h3>
          <p
            className="text-[12px] mb-5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            필요한 직무와 요구 스택을 설정하세요
          </p>

          {/* 1. 직무 선택 */}
          <label
            className="block text-[12.5px] font-bold mb-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            직무 선택 <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {ROLE_LIST.map((role) => {
              const isAdded = addedRoles.includes(role);
              const isSelected = selectedRole === role;

              let btnStyle: React.CSSProperties;
              if (isAdded) {
                btnStyle = {
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  opacity: 0.5,
                  cursor: "not-allowed",
                };
              } else if (isSelected) {
                btnStyle = {
                  background: "var(--color-primary-soft)",
                  border: "1px solid var(--color-primary-hover)",
                  cursor: "pointer",
                };
              } else {
                btnStyle = {
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  cursor: "pointer",
                };
              }

              const dotColor = isAdded
                ? "var(--color-text-tertiary)"
                : isSelected
                  ? "var(--color-primary-hover)"
                  : "var(--color-border)";

              return (
                <button
                  key={role}
                  disabled={isAdded}
                  onClick={() => handleSelectRole(role)}
                  className="w-[145px] h-[40px] rounded-[10px] flex items-center gap-2 px-3 text-left"
                  style={btnStyle}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: dotColor }}
                  />
                  <div className="flex flex-col">
                    <span
                      className="text-[12.5px] font-semibold"
                      style={{
                        color: isAdded
                          ? "var(--color-text-tertiary)"
                          : "var(--color-text-primary)",
                      }}
                    >
                      {getRoleDisplayName(role)}
                    </span>
                    {isAdded && (
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        추가됨
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 2. 모집 인원 */}
          <label
            className="block text-[12.5px] font-bold mb-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            모집 인원
          </label>
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setCount(Math.max(1, count - 1))}
              className="w-[34px] h-[34px] flex items-center justify-center rounded-[8px] cursor-pointer"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Minus className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
            </button>
            <span
              className="text-[18px] font-extrabold w-8 text-center"
              style={{ color: "var(--color-text-primary)" }}
            >
              {count}
            </span>
            <button
              onClick={() => setCount(Math.min(10, count + 1))}
              className="w-[34px] h-[34px] flex items-center justify-center rounded-[8px] cursor-pointer"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Plus className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
            </button>
            <span
              className="text-[12px]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              명
            </span>
          </div>

          {/* 3. 요구 스택/기술 */}
          <label
            className="block text-[12.5px] font-bold mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            요구 스택/기술 <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <p
            className="text-[11.5px] mb-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Enter 또는 쉼표로 추가 · Backspace로 마지막 태그 삭제
          </p>
          {/* 추천 태그 (클릭으로 추가) */}
          {selectedRole && quickTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => addStack(tag)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer transition-colors"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-primary-soft)";
                    e.currentTarget.style.borderColor = "var(--color-primary-hover)";
                    e.currentTarget.style.color = "var(--color-primary-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--color-surface)";
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }}
                >
                  + {tag}
                </button>
              ))}
            </div>
          )}

          {/* 입력 필드 */}
          <div
            ref={inputWrapRef}
            className="flex flex-wrap items-center gap-1.5 min-h-[48px] px-3 py-2 rounded-[10px]"
            style={{
              background: "var(--color-surface)",
              border: "1.333px solid var(--color-border)",
            }}
          >
            {stacks.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs"
                style={{
                  background: "var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {s}
                <button
                  onClick={() => setStacks(stacks.filter((x) => x !== s))}
                  className="cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              value={stackInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={stacks.length === 0 ? "스택 입력 후 Enter..." : ""}
              className="flex-1 min-w-[100px] text-[12.5px] font-mono outline-none bg-transparent"
              style={{ color: "var(--color-text-primary)" }}
            />
          </div>

          {/* 자동완성 리스트박스 (fixed → 모달 밖으로 렌더링) */}
          {showSuggestions && filtered.length > 0 && (
            <div
              ref={listRef}
              className="fixed z-[100] h-[180px] overflow-y-auto rounded-[10px]"
              style={{
                top: listPos.top,
                left: listPos.left,
                width: listPos.width,
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                boxShadow: "0px 8px 24px 0px rgba(0,0,0,0.12)",
              }}
            >
              {filtered.map((item, idx) => (
                <button
                  key={item}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(item);
                  }}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className="w-full text-left px-3 py-2 text-[12.5px] cursor-pointer flex items-center gap-2"
                  style={{
                    background: idx === highlightIdx ? "var(--color-primary-soft)" : "transparent",
                    color: idx === highlightIdx ? "var(--color-primary-hover)" : "var(--color-text-primary)",
                    borderBottom: idx < filtered.length - 1 ? "1px solid var(--color-border)" : "none",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      background: idx === highlightIdx ? "var(--color-primary-hover)" : "var(--color-text-tertiary)",
                    }}
                  />
                  {item}
                </button>
              ))}
            </div>
          )}

          {/* 4. 하단 버튼 */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={onClose}
              className="flex-1 h-[49px] rounded-[14px] text-[14px] font-black cursor-pointer"
              style={{
                background: "var(--color-surface)",
                border: "2px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex-1 h-[49px] rounded-[14px] text-[14px] font-black"
              style={{
                background: canConfirm ? "var(--color-primary-hover)" : "var(--color-border)",
                color: canConfirm ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                cursor: canConfirm ? "pointer" : "not-allowed",
              }}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════ */
const TeamManagement = ({
  roles: initialRoles,
  members,
  applications: initialApps,
  projectId,
  onLeaderDelegated,
  onRefresh,
}: TeamManagementProps) => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState(initialRoles);
  const [localMembers, setLocalMembers] = useState(members);
  const [applications, setApplications] = useState(initialApps);

  const initialRolesJson = JSON.stringify(initialRoles);
  const membersJson = JSON.stringify(members);
  const initialAppsJson = JSON.stringify(initialApps);

  useEffect(() => {
    setRoles(initialRoles);
  }, [initialRolesJson]);
  useEffect(() => {
    setLocalMembers(members);
  }, [membersJson]);
  useEffect(() => {
    setApplications(initialApps);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAppsJson]);
  const [showRecruitModal, setShowRecruitModal] = useState(false);
  const [confirmAcceptId, setConfirmAcceptId] = useState<string | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);
  const [kickMemberId, setKickMemberId] = useState<string | null>(null);
  const kickTarget = localMembers.find((m) => m.id === kickMemberId) ?? null;
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  const [delegateMemberId, setDelegateMemberId] = useState<string | null>(null);
  const delegateTarget = localMembers.find((m) => m.id === delegateMemberId) ?? null;


  const totalCurrent = roles.reduce((s, r) => s + r.current, 0);
  const totalAll = roles.reduce((s, r) => s + r.total, 0);
  const isCurrentUserLeader = localMembers.some((m) => m.isLeader && m.isMe);

  const membersByRole = localMembers.reduce<Record<string, Member[]>>((acc, m) => {
    (acc[m.role] ??= []).push(m);
    return acc;
  }, {});

  const addedRoles = roles.map((r) => DISPLAY_TO_ROLE[r.name] ?? r.name) as RoleCode[];

  const handleUpdateCount = async (roleId: string, delta: number) => {
    if (!projectId) return;
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;
    const newTotal = Math.max(role.current, role.total + delta);
    try {
      await updateRecruitmentTargetCount(projectId, Number(roleId), newTotal);
      setRoles((prev) =>
        prev.map((r) => {
          if (r.id !== roleId) return r;
          return {
            ...r,
            total: newTotal,
            status: r.current >= newTotal ? "closed" : "open",
          };
        }),
      );
    } catch (err) {
      console.error('모집 인원 변경 실패:', err);
    }
  };

  const handleUpdateStatus = async (roleId: string, status: RoleStatus) => {
    if (!projectId) return;
    const apiStatus = status === "open" ? "RECRUITING" : "DONE";
    try {
      await updateRecruitmentStatus(projectId, Number(roleId), apiStatus);
      setRoles((prev) =>
        prev.map((r) => (r.id === roleId ? { ...r, status } : r)),
      );
    } catch (err) {
      console.error('모집 상태 변경 실패:', err);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    const roleMembers = membersByRole[role.name] ?? [];
    if (roleMembers.length > 0) {
      alert(`${getRoleDisplayName(role.name)} 직무에 팀원이 있어 삭제할 수 없습니다.`);
      return;
    }

    // 같은 displayName을 가진 모든 recruitment ID 수집
    const allIdsForRole = roles
      .filter((r) => r.name === role.name)
      .map((r) => r.id)
      .filter((id) => !isNaN(Number(id)));

    if (projectId && allIdsForRole.length > 0) {
      try {
        await Promise.all(
          allIdsForRole.map((id) => deleteRecruitment(projectId, Number(id))),
        );
        setRoles((prev) => prev.filter((r) => r.name !== role.name));
      } catch {
        alert('직무 삭제에 실패했습니다.');
      }
    } else {
      // member-role 등 백엔드에 없는 역할은 로컬만 제거
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
    }
  };

  const handleAccept = async (appId: string) => {
    try {
      await acceptRequest(Number(appId));
      const app = applications.find((a) => a.id === appId);
      if (app) {
        setLocalMembers((prev) => [
          ...prev,
          {
            id: appId,
            name: app.name,
            role: app.role,
            joinDate: new Date().toISOString().slice(0, 10),
            contribution: 0,
            profileImageUrl: app.profileImageUrl,
          },
        ]);
        setRoles((prev) =>
          prev.map((r) => {
            if (r.name !== app.role) return r;
            const newCurrent = r.current + 1;
            const newTotal = Math.max(r.total, newCurrent);
            if (projectId && !isNaN(Number(r.id)) && newTotal !== r.total) {
              updateRecruitmentTargetCount(projectId, Number(r.id), newTotal).catch(() => {});
            }
            return {
              ...r,
              current: newCurrent,
              total: newTotal,
              status: newCurrent >= newTotal ? "closed" : r.status,
            };
          }),
        );
      }
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch (err) {
      console.error('참여 수락 실패:', err);
    }
  };

  const handleReject = async (appId: string) => {
    try {
      await rejectRequest(Number(appId));
      setApplications((prev) => prev.filter((a) => a.id !== appId));
    } catch (err) {
      console.error('참여 거절 실패:', err);
    }
  };

  const handleRecruitConfirm = async (data: { role: RoleCode; count: number; stacks: string[] }) => {
    if (!projectId) return;
    try {
      const { data: res } = await createRecruitment(projectId, {
        role: data.role,
        targetCount: data.count,
        requireSkills: data.stacks,
      });
      const currentCount = localMembers.filter(
        (m) => m.role === getRoleDisplayName(data.role),
      ).length;
      const newRole: Role = {
        id: String(res.positionId),
        name: data.role,
        status: currentCount >= data.count ? "closed" : "open",
        current: currentCount,
        total: data.count,
        stacks: data.stacks,
      };
      setRoles((prev) => [...prev, newRole]);
      setShowRecruitModal(false);
      onRefresh?.();
    } catch (err: any) {
      console.error('모집 공고 생성 실패:', err.response?.data ?? err);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── 상단 액션 바 ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowRecruitModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer flex-1 sm:flex-initial justify-center"
            style={{ background: "var(--color-primary-hover)", color: "var(--color-text-primary)" }}
          >
            <UserPlus className="w-4 h-4" />
            모집 직무 추가
          </button>
          <button
            onClick={() => navigate(`/team-recommend/${projectId}`)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer flex-1 sm:flex-initial justify-center"
            style={{ background: "var(--color-primary-hover)", color: "var(--color-text-primary)" }}
          >
            <Plus className="w-4 h-4" />
            팀원 추가하기
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {totalCurrent}/{totalAll}명 충원
          </span>
        </div>
      </div>

      {/* ── 직무별 카드 그리드 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-[1200px]">
        {roles.map((role) => {
          const color = getRoleColor(role.name);
          const roleMembers = membersByRole[role.name] ?? [];
          const emptySlots = Math.max(0, role.total - roleMembers.length);
          const roleApps = applications.filter(
            (a) => a.role === role.name && a.status === "pending",
          );
          // 모집 공고가 있는 역할(positionId가 숫자)만 편집 가능
          const isRecruitableRole = !isNaN(Number(role.id));
          // 현재 멤버가 있는 역할은 삭제 불가
          const isDeletableRole = isRecruitableRole && roleMembers.length === 0;

          return (
            <div
              key={role.id}
              className="rounded-2xl p-5 overflow-visible flex flex-col"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.06)",
              }}
            >
              {/* ── 카드 헤더: 역할명 + 인원조정 + 상태 + 삭제 ── */}
              <div className="flex items-center justify-between mb-4 mt-1">
                <span className="text-base font-bold" style={{ color }}>
                  {getRoleDisplayName(role.name)}
                </span>
                <div className="flex items-center gap-2">
                  {isRecruitableRole && (
                    <>
                      {/* 인원 조정 */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateCount(role.id, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                          style={{ border: "1px solid var(--color-border)" }}
                        >
                          <Minus className="w-3.5 h-3.5" style={{ color: "var(--color-text-secondary)" }} />
                        </button>
                        <span
                          className="text-sm font-bold w-6 text-center"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {role.total}
                        </span>
                        <button
                          onClick={() => handleUpdateCount(role.id, 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                          style={{ border: "1px solid var(--color-border)" }}
                        >
                          <Plus className="w-3.5 h-3.5" style={{ color: "var(--color-text-secondary)" }} />
                        </button>
                      </div>
                      <StatusDropdown
                        roleId={role.id}
                        currentStatus={role.status}
                        onSelect={handleUpdateStatus}
                      />
                      {isDeletableRole && (
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ── 멤버 슬롯 (세로 사각형 박스) ── */}
              <div className="flex flex-wrap gap-2 mb-3 justify-center">
                {roleMembers.map((member) => (
                  <div
                    key={member.id}
                    role="button"
                    tabIndex={0}
                    className="group relative flex flex-col items-center justify-center gap-1.5 rounded-xl cursor-pointer hover:border-[var(--color-primary-hover)] transition-all"
                    style={{
                      background: "var(--color-background, #f7f8fa)",
                      border: "1px solid var(--color-border)",
                      width: "160px",
                      height: "180px",
                    }}
                    onClick={() => setProfileUserId(Number(member.id))}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProfileUserId(Number(member.id)); } }}
                  >
                    {/* 1행: 프로필 사진 */}
                    {member.profileImageUrl ? (
                      <img src={member.profileImageUrl} alt={member.name} className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center text-white text-xl font-bold"
                        style={{ background: getAvatarColor(member.name) }}
                      >
                        {member.name.charAt(0)}
                      </div>
                    )}
                    {/* 2행: 이름 + 뱃지 */}
                    <div className="flex items-center gap-0.5 max-w-full px-1 mt-2">
                      {member.isLeader && <Crown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#F59E0B" }} />}
                      <span
                        className="text-base font-semibold truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {member.name}
                      </span>
                      {member.isMe && (
                        <span className="text-sm font-medium flex-shrink-0" style={{ color: "var(--color-text-tertiary)" }}>(나)</span>
                      )}
                    </div>
                    {/* hover 시 관리 버튼 */}
                    {isCurrentUserLeader && !member.isLeader && (
                      <div className="hidden group-hover:flex absolute top-2 right-2 gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setDelegateMemberId(member.id); }}
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}
                        >
                          <Crown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setKickMemberId(member.id); }}
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {/* 빈 슬롯 (세로 사각형 박스) */}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="rounded-xl flex flex-col items-center justify-center gap-2"
                    style={{
                      background: "var(--color-border, #e5e7eb)",
                      width: "160px",
                      height: "180px",
                    }}
                  >
                    <UserRound className="w-10 h-10" style={{ color: "var(--color-text-tertiary)", opacity: 0.5 }} />
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)", opacity: 0.7 }}>팀원 모집 중..</span>
                  </div>
                ))}
              </div>

              {/* ── 요구 스택 ── */}
              {role.stacks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {role.stacks.map((stack) => (
                    <span
                      key={stack}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                      style={{ background: "var(--color-border)", color: "var(--color-text-secondary)" }}
                    >
                      {stack}
                    </span>
                  ))}
                </div>
              )}

              {/* ── 합류 신청 목록 (해당 역할만) ── */}
              {roleApps.length > 0 && (
                <div
                  className="border-t pt-3 mt-auto flex flex-col gap-2"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <span
                    className="text-xs font-bold mb-1"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    합류 신청 목록
                  </span>
                  {roleApps.map((app) => {
                    const appColor = getRoleColor(app.role);
                    return (
                      <div
                        key={app.id}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                        style={{ background: "#fafafa", border: "1px solid var(--color-border)" }}
                      >
                        {/* 아바타 */}
                        {app.profileImageUrl ? (
                          <img src={app.profileImageUrl} alt={app.name} className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: getAvatarColor(app.name) }}
                          >
                            {app.name.charAt(0)}
                          </div>
                        )}
                        {/* 이름 + 뱃지 + 날짜 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                              {app.name}
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                              style={{ background: `${appColor}20`, color: appColor }}
                            >
                              {getRoleDisplayName(app.role)}
                            </span>
                            <span className="text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
                              {app.appliedAt}
                            </span>
                          </div>
                        </div>
                        {/* 수락/거절 버튼 */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setConfirmAcceptId(app.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-success)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "var(--color-success)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-surface)"; e.currentTarget.style.color = "var(--color-text-secondary)"; e.currentTarget.style.borderColor = "var(--color-border)"; }}
                          >
                            ✓ 수락
                          </button>
                          <button
                            onClick={() => setConfirmRejectId(app.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-error)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "var(--color-error)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-surface)"; e.currentTarget.style.color = "var(--color-text-secondary)"; e.currentTarget.style.borderColor = "var(--color-border)"; }}
                          >
                            × 거절
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 팀원 모집하기 모달 ── */}
      <RecruitModal
        isOpen={showRecruitModal}
        onClose={() => setShowRecruitModal(false)}
        onConfirm={handleRecruitConfirm}
        addedRoles={addedRoles}
      />

      {/* ── 수락 확인 모달 ── */}
      {confirmAcceptId && (() => {
        const app = applications.find((a) => a.id === confirmAcceptId);
        if (!app) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setConfirmAcceptId(null)}
          >
            <div
              className="bg-white rounded-2xl px-8 py-8 flex flex-col items-center gap-4 w-[320px] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 체크 아이콘 */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#dcfce7" }}
              >
                <Check className="w-8 h-8" style={{ color: "var(--color-success)" }} />
              </div>

              {/* 텍스트 */}
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {app.name}님 수락
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  팀원으로 수락하시겠습니까?
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 w-full mt-1">
                <button
                  onClick={() => setConfirmAcceptId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    handleAccept(confirmAcceptId);
                    setConfirmAcceptId(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "var(--color-success)" }}
                >
                  수락하기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 거절 확인 모달 ── */}
      {confirmRejectId && (() => {
        const app = applications.find((a) => a.id === confirmRejectId);
        if (!app) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setConfirmRejectId(null)}
          >
            <div
              className="bg-white rounded-2xl px-8 py-8 flex flex-col items-center gap-4 w-[320px] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* X 아이콘 */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#fee2e2" }}
              >
                <X className="w-8 h-8" style={{ color: "var(--color-error)" }} />
              </div>

              {/* 텍스트 */}
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {app.name}님 거절
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  참가 신청을 거절하시겠습니까?
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 w-full mt-1">
                <button
                  onClick={() => setConfirmRejectId(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    handleReject(confirmRejectId);
                    setConfirmRejectId(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "var(--color-error)" }}
                >
                  거절하기
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 팀원 내보내기 확인 모달 ── */}
      {kickMemberId && kickTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setKickMemberId(null)}
        >
          <div
            className="rounded-2xl px-12 py-10 flex flex-col items-center gap-4 w-[400px] shadow-xl"
            style={{ background: "var(--color-surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 아이콘 */}
            <div className="bg-red-100 rounded-2xl p-4 mb-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
                <line x1="18" y1="8" x2="23" y2="13"/>
                <line x1="23" y1="8" x2="18" y2="13"/>
              </svg>
            </div>

            {/* 텍스트 */}
            <h2 className="text-xl font-bold text-gray-900">
              {kickTarget.name}님 내보내기
            </h2>
            <p className="text-sm text-gray-500 text-center leading-relaxed">
              팀에서 내보내시겠습니까?
              <br />
              되돌릴 수 없습니다.
            </p>

            {/* 버튼 */}
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setKickMemberId(null)}
                className="flex-1 py-3 rounded-2xl border border-border text-text-primary font-medium text-base hover:bg-background transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => {
                  const numericMemberId = Number(kickMemberId);
                  const targetId = kickMemberId;
                  if (projectId && targetId && !isNaN(numericMemberId)) {
                    const kickedMember = localMembers.find((m) => Number(m.id) === numericMemberId);
                    removeMember(projectId, numericMemberId)
                      .then(() => {
                        setLocalMembers((prev) => prev.filter((m) => Number(m.id) !== numericMemberId));
                        if (kickedMember) {
                          setRoles((prev) =>
                            prev.map((r) => {
                              if (r.name !== kickedMember.role) return r;
                              const newCurrent = Math.max(0, r.current - 1);
                              const newTotal = Math.max(newCurrent, r.total - 1);
                              // 백엔드에도 인원 수 반영
                              if (!isNaN(Number(r.id))) {
                                updateRecruitmentTargetCount(projectId, Number(r.id), newTotal).catch(() => {});
                              }
                              return { ...r, current: newCurrent, total: newTotal, status: newCurrent < newTotal ? "open" : r.status };
                            }),
                          );
                        }
                      })
                      .catch((err) => {
                        console.error('팀원 내보내기 실패:', err);
                        alert('팀원 내보내기에 실패했습니다. 다시 시도해주세요.');
                      });
                  }
                  setKickMemberId(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-base hover:bg-red-600 transition-colors cursor-pointer"
              >
                내보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 팀장 위임 확인 모달 ── */}
      {delegateMemberId && delegateTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setDelegateMemberId(null)}
        >
          <div
            className="rounded-2xl px-12 py-10 flex flex-col items-center gap-4 w-[400px] shadow-xl"
            style={{ background: "var(--color-surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 아이콘 */}
            <div className="rounded-2xl p-4 mb-2" style={{ background: "rgba(245,158,11,0.15)" }}>
              <Crown className="w-8 h-8" style={{ color: "#F59E0B" }} />
            </div>

            {/* 텍스트 */}
            <h2 className="text-xl font-bold text-gray-900">
              팀장 위임
            </h2>
            <p className="text-sm text-gray-500 text-center leading-relaxed">
              {delegateTarget.name}님에게
              <br />
              팀장을 위임하시겠습니까?
            </p>

            {/* 버튼 */}
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setDelegateMemberId(null)}
                className="flex-1 py-3 rounded-2xl border border-border text-text-primary font-medium text-base hover:bg-background transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (!projectId || !delegateMemberId) return;
                  delegateLeader(projectId, Number(delegateMemberId))
                    .then(() => {
                      setDelegateMemberId(null);
                      onLeaderDelegated?.();
                    })
                    .catch(() => alert('팀장 위임에 실패했습니다. 다시 시도해주세요.'));
                }}
                className="flex-1 py-3 rounded-2xl text-white font-semibold text-base transition-colors cursor-pointer"
                style={{ background: "#F59E0B" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#D97706")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#F59E0B")}
              >
                위임하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GitHub 기여자 초대 제안 ── */}
      {projectId && <GitHubContributorSuggestion projectId={projectId} />}

      {profileUserId !== null && (
        <UserProfileModal
          isOpen={true}
          onClose={() => setProfileUserId(null)}
          userId={profileUserId}
        />
      )}
    </div>
  );
};

/* ── GitHub 기여자 초대 제안 컴포넌트 ── */
const GitHubContributorSuggestion = ({ projectId }: { projectId: number }) => {
  const [contributors, setContributors] = useState<{ userId: number; userName: string; profileImageUrl: string | null; prCount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteTarget, setInviteTarget] = useState<{ userId: number; userName: string } | null>(null);

  useEffect(() => {
    getGitHubContributors(projectId)
      .then(({ data }) => {
        setContributors(data.data ?? []);
      })
      .catch(() => setContributors([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading || contributors.length === 0) return null;

  return (
    <>
      <div className="rounded-2xl border border-border bg-surface overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#24292f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
          </svg>
          <span className="text-base font-bold text-text-primary">GitHub 기여자 초대 제안</span>
          <span className="text-xs text-text-tertiary ml-1">PR을 올렸지만 아직 팀원이 아닌 유저</span>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          {contributors.map((c) => (
            <div key={c.userId} className="flex items-center gap-3 py-2">
              {c.profileImageUrl ? (
                <img src={c.profileImageUrl} alt={c.userName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-500">
                  {c.userName.charAt(0)}
                </div>
              )}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-text-primary truncate">{c.userName}</span>
                <span className="text-xs text-text-tertiary">PR {c.prCount}건</span>
              </div>
              <button
                onClick={() => setInviteTarget({ userId: c.userId, userName: c.userName })}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                style={{ background: "var(--color-primary-soft)", color: "var(--color-primary-hover)" }}
              >
                초대하기
              </button>
            </div>
          ))}
        </div>
      </div>
      {inviteTarget && (
        <TeamInviteModal
          isOpen={true}
          onClose={() => setInviteTarget(null)}
          memberName={inviteTarget.userName}
          userId={inviteTarget.userId}
          fixedProjectId={projectId}
        />
      )}
    </>
  );
};

/* ── 팀원용 뷰 (리더 UI와 유사한 레이아웃) ── */
const MemberView = ({ dashboard, projectId }: { dashboard?: TeamDashboard | null; projectId?: number }) => {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [realMembers, setRealMembers] = useState<Member[]>([]);
  const [realRoles, setRealRoles] = useState<Role[]>([]);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!projectId) return;
    getTeamManagement(projectId)
      .then(({ data }: { data: any }) => {
        const detail = data.data ?? data;
        if (detail.currentMembers) {
          setRealMembers(detail.currentMembers.map((m: any) => ({
            id: m.userId?.toString() ?? String(m.userId),
            name: m.userName ?? "팀원",
            role: getRoleDisplayName(m.role),
            joinDate: m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("ko-KR") : "-",
            contribution: 0,
            isLeader: m.userId === detail.leaderId,
            isMe: m.userId === currentUserId,
            profileImageUrl: m.profileImageUrl,
          })));
        }
        if (detail.recruitments) {
          const roleMap = (detail.recruitments as any[]).reduce((acc: Record<string, Role>, r: any) => {
              const displayName = getRoleDisplayName(r.role);
              const memberCount = (detail.currentMembers ?? []).filter((m: any) => m.role === r.role).length;
              const current = r.currentCount > 0 ? r.currentCount : memberCount;
              if (acc[displayName]) {
                acc[displayName].total += r.targetCount;
                acc[displayName].current = memberCount;
                acc[displayName].stacks = [...new Set([...acc[displayName].stacks, ...(r.requireSkills ?? [])])];
                acc[displayName].status = acc[displayName].current >= acc[displayName].total ? "closed" : "open";
              } else {
                acc[displayName] = {
                  id: r.positionId?.toString() ?? String(r.role),
                  name: displayName,
                  status: current >= r.targetCount ? "closed" : (r.status === "RECRUITING" ? "open" : "closed"),
                  current,
                  total: r.targetCount,
                  stacks: r.requireSkills ?? [],
                };
              }
              return acc;
            }, {} as Record<string, Role>);
          // 모집 직무가 없지만 멤버가 있는 역할도 카드로 추가
          (detail.currentMembers ?? []).forEach((m: any) => {
            const displayName = getRoleDisplayName(m.role);
            if (!roleMap[displayName]) {
              const count = (detail.currentMembers ?? []).filter((cm: any) => cm.role === m.role).length;
              roleMap[displayName] = {
                id: `member-role-${m.role}`,
                name: displayName,
                status: "closed",
                current: count,
                total: count,
                stacks: [],
              };
            }
          });
          setRealRoles(Object.values(roleMap) as Role[]);
        }
      })
      .catch(() => {});
  }, [projectId, currentUserId]);

  const roles = realRoles.length > 0 ? realRoles : (dashboard ? dashboardToRoles(dashboard) : []);
  const members = realMembers.length > 0 ? realMembers : (dashboard ? dashboardToMembers(dashboard) : []);
  const totalMembers = dashboard?.teamStats.totalMembers ?? 0;
  const totalTarget = roles.reduce((sum, r) => sum + r.total, 0);

  const membersByRole = members.reduce<Record<string, Member[]>>((acc, m) => {
    (acc[m.role] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      {/* ── 상단 액션 바 ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {totalMembers}/{totalTarget}명 충원
          </span>
        </div>
      </div>

      {/* ── 직무별 카드 그리드 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-[1200px]">
        {roles.map((role) => {
          const color = getRoleColor(role.name);
          const roleMembers = membersByRole[role.name] ?? [];
          const emptySlots = Math.max(0, role.total - roleMembers.length);

          return (
            <div
              key={role.id}
              className="rounded-2xl p-5 overflow-visible flex flex-col"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.06)",
              }}
            >
              {/* ── 카드 헤더: 역할명 + 인원 + 상태 ── */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold" style={{ color }}>
                    {getRoleDisplayName(role.name)}
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {role.current}/{role.total}
                  </span>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: role.status === "open" ? "rgba(34,197,94,0.1)" : "var(--color-border)",
                    color: role.status === "open" ? "#22c55e" : "var(--color-text-tertiary)",
                  }}
                >
                  {role.status === "open" ? "모집 중" : "모집 완료"}
                </span>
              </div>

              {/* ── 멤버 슬롯 (세로 사각형 박스) ── */}
              <div className="flex flex-wrap gap-2 mb-3 justify-center">
                {roleMembers.map((member) => (
                  <div
                    key={member.id}
                    role="button"
                    tabIndex={0}
                    className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl cursor-pointer hover:border-[var(--color-primary-hover)] transition-all"
                    style={{
                      background: "var(--color-background, #f7f8fa)",
                      border: "1px solid var(--color-border)",
                      width: "160px",
                      height: "180px",
                    }}
                    onClick={() => setProfileUserId(Number(member.id))}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setProfileUserId(Number(member.id)); } }}
                  >
                    {/* 1행: 프로필 사진 */}
                    {member.profileImageUrl ? (
                      <img src={member.profileImageUrl} alt={member.name} className="w-24 h-24 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center text-white text-xl font-bold"
                        style={{ background: getAvatarColor(member.name) }}
                      >
                        {member.name.charAt(0)}
                      </div>
                    )}
                    {/* 2행: 이름 + 뱃지 */}
                    <div className="flex items-center gap-0.5 max-w-full px-1 mt-2">
                      {member.isLeader && <Crown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#F59E0B" }} />}
                      <span
                        className="text-base font-semibold truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {member.name}
                      </span>
                      {member.isMe && (
                        <span className="text-sm font-medium flex-shrink-0" style={{ color: "var(--color-text-tertiary)" }}>(나)</span>
                      )}
                    </div>
                  </div>
                ))}
                {/* 빈 슬롯 */}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="rounded-xl flex flex-col items-center justify-center gap-2"
                    style={{
                      background: "var(--color-border, #e5e7eb)",
                      width: "160px",
                      height: "180px",
                    }}
                  >
                    <UserRound className="w-10 h-10" style={{ color: "var(--color-text-tertiary)", opacity: 0.5 }} />
                    <span className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)", opacity: 0.7 }}>팀원 모집 중..</span>
                  </div>
                ))}
              </div>

              {/* ── 요구 스택 ── */}
              {role.stacks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {role.stacks.map((stack) => (
                    <span
                      key={stack}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                      style={{ background: "var(--color-border)", color: "var(--color-text-secondary)" }}
                    >
                      {stack}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {profileUserId !== null && (
        <UserProfileModal
          isOpen
          onClose={() => setProfileUserId(null)}
          userId={profileUserId}
        />
      )}
    </div>
  );
};

/* ── 기본 export ── */
const TeamMembers = ({ dashboard, projectId, onLeaderChanged }: { dashboard?: TeamDashboard | null; projectId?: number; onLeaderChanged?: () => void }) => {
  const [detail, setDetail] = useState<TeamManagementData | null>(null);
  const [isLeader, setIsLeader] = useState<boolean | null>(null);
  const currentUserId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchDetail = () => {
    if (!projectId) return;
    getTeamManagement(projectId)
      .then(({ data }) => {
        const d = data.data ?? data;
        setDetail(d);
        setIsLeader(d.leader === true);
      })
      .catch(() => setIsLeader(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [projectId]);

  // 리더가 아니면 간소화 뷰
  if (isLeader === false) {
    return <MemberView dashboard={dashboard} projectId={projectId} />;
  }

  // 로딩 중
  if (isLeader === null) {
    return <p className="text-center py-12 text-sm" style={{ color: "var(--color-text-secondary)" }}>불러오는 중...</p>;
  }

  // currentCount가 백엔드에서 0으로 오는 문제 → currentMembers에서 해당 role 수를 직접 계산
  const memberCountByRole = detail
    ? detail.currentMembers.reduce<Record<string, number>>((acc, m) => {
        acc[m.role] = (acc[m.role] ?? 0) + 1;
        return acc;
      }, {})
    : {};

  // 같은 역할의 recruitment를 합쳐서 하나의 카드로 만듦
  const rolesFromRecruitments: Record<string, Role> = detail
    ? detail.recruitments.reduce<Record<string, Role>>((acc, r) => {
        const displayName = getRoleDisplayName(r.role);
        const computedCount = memberCountByRole[r.role] ?? 0;
        const current = r.currentCount > 0 ? r.currentCount : computedCount;
        if (acc[displayName]) {
          acc[displayName].total += r.targetCount;
          acc[displayName].current = computedCount;
          acc[displayName].stacks = [...new Set([...acc[displayName].stacks, ...(r.requireSkills ?? [])])];
          acc[displayName].status = acc[displayName].current >= acc[displayName].total ? "closed" : "open";
        } else {
          acc[displayName] = {
            id: r.positionId.toString(),
            name: displayName,
            status: current >= r.targetCount ? "closed" : (r.status === "RECRUITING" ? "open" : "closed"),
            current,
            total: r.targetCount,
            stacks: r.requireSkills ?? [],
          };
        }
        return acc;
      }, {})
    : {};

  // 모집 직무가 없지만 멤버가 있는 역할도 카드로 추가
  if (detail) {
    detail.currentMembers.forEach((m: any) => {
      const displayName = getRoleDisplayName(m.role);
      if (!rolesFromRecruitments[displayName]) {
        const count = memberCountByRole[m.role] ?? 0;
        rolesFromRecruitments[displayName] = {
          id: `member-role-${m.role}`,
          name: displayName,
          status: "closed",
          current: count,
          total: count,
          stacks: [],
        };
      }
    });
  }

  const roles: Role[] = detail
    ? Object.values(rolesFromRecruitments)
    : dashboard ? dashboardToRoles(dashboard) : [];

  const members: Member[] = detail
    ? detail.currentMembers.map((m: any) => ({
        id: m.userId.toString(),
        name: m.userName,
        role: getRoleDisplayName(m.role),
        joinDate: new Date(m.joinedAt).toLocaleDateString("ko-KR"),
        contribution: 0,
        isLeader: m.userId === detail.leaderId,
        isMe: m.userId === currentUserId,
        profileImageUrl: m.profileImageUrl,
      }))
    : dashboard ? dashboardToMembers(dashboard) : [];

  const applications: Application[] = detail
    ? detail.pendingRequests.map((r) => ({
        id: r.requestId.toString(),
        name: r.userName,
        role: getRoleDisplayName(r.positionName),
        appliedAt: new Date(r.createdAt).toLocaleDateString("ko-KR"),
        stacks: r.techStacks,
        status: "pending" as const,
        profileImageUrl: r.userProfileImageUrl,
      }))
    : [];

  return (
    <TeamManagement
      key={projectId ?? dashboard?.projectInfo.title ?? "default"}
      projectName={dashboard?.projectInfo.title ?? "프로젝트"}
      projectId={projectId}
      roles={roles}
      members={members}
      applications={applications}
      onLeaderDelegated={() => { fetchDetail(); onLeaderChanged?.(); }}
      onRefresh={fetchDetail}
    />
  );
};

export default TeamMembers;
export { TeamManagement, RecruitModal };
export type { Role, Member, Application, TeamManagementProps, RoleStatus, RecruitModalProps };
