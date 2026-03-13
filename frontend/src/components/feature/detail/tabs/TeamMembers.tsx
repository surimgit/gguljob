import { useState, useMemo } from "react";
import {
  Trash2,
  ChevronDown,
  Plus,
  Minus,
  UserPlus,
  X,
} from "lucide-react";
import type { TeamDashboard } from "../../../../types/project";

/* ── 타입 ── */
interface Role {
  id: string;
  name: string;
  status: "open" | "closed";
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
}

interface Application {
  id: string;
  name: string;
  role: string;
  appliedAt: string;
  stacks: string[];
  status: "pending" | "accepted" | "rejected";
}

interface TeamManagementProps {
  projectName: string;
  roles: Role[];
  members: Member[];
  applications: Application[];
  onAddRole: () => void;
  onDeleteRole: (roleId: string) => void;
  onUpdateRoleCount: (roleId: string, delta: number) => void;
  onToggleRoleStatus: (roleId: string) => void;
  onAccept: (applicationId: string) => void;
  onReject: (applicationId: string) => void;
}

/* ── 직무별 색상 ── */
const ROLE_COLORS: Record<string, string> = {
  Frontend: "#2196F3",
  Backend: "#22C55E",
  Design: "#d22ab6",
  PM: "#F59E0B",
  DevOps: "#7C3AED",
  AI: "#EC4899",
};

const getRoleColor = (role: string) => ROLE_COLORS[role] ?? "#6B7280";

/* ── 아바타 색상 (해시 기반) ── */
const AVATAR_COLORS = [
  "#2196F3",
  "#22C55E",
  "#EC4899",
  "#7C3AED",
  "#F59E0B",
  "#EF4444",
  "#14B8A6",
  "#F97316",
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/* ── 역할 코드→표시명 ── */
const ROLE_CODE_TO_LABEL: Record<string, string> = {
  FE: "Frontend",
  BE: "Backend",
  AI: "AI",
  PM: "PM",
  INFRA: "Infra",
  DESIGN: "Design",
  FRONTEND: "Frontend",
  BACKEND: "Backend",
};

/* ── dashboard → props 변환 ── */
const dashboardToRoles = (dashboard: TeamDashboard): Role[] => {
  const { roleCounts } = dashboard.teamStats;
  if (!roleCounts) return [];
  return Object.entries(roleCounts).map(([code, count], idx) => {
    const name = ROLE_CODE_TO_LABEL[code] ?? code;
    return {
      id: `role-${idx}`,
      name,
      status: (count > 0 ? "closed" : "open") as "open" | "closed",
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
  Object.entries(roleCounts).forEach(([code, count]) => {
    const roleName = ROLE_CODE_TO_LABEL[code] ?? code;
    for (let i = 0; i < count; i++) {
      members.push({
        id: `${code}-${i}`,
        name: `${roleName} ${i + 1}`,
        role: roleName,
        joinDate: "-",
        contribution: 0,
        isLeader: members.length === 0,
      });
    }
  });
  return members;
};

/* ── 직무 추가 모달 ── */
const AddRoleModal = ({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string, total: number, stacks: string[]) => void;
}) => {
  const [name, setName] = useState("");
  const [total, setTotal] = useState(1);
  const [stackInput, setStackInput] = useState("");
  const [stacks, setStacks] = useState<string[]>([]);

  const addStack = () => {
    const trimmed = stackInput.trim();
    if (trimmed && !stacks.includes(trimmed)) {
      setStacks([...stacks, trimmed]);
      setStackInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-[420px] rounded-2xl p-6"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            직무 추가하기
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 직무명 */}
        <label
          className="block text-sm font-semibold mb-1.5"
          style={{ color: "var(--color-text-primary)" }}
        >
          직무명
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: Frontend, Backend, Design"
          className="w-full px-3 py-2.5 rounded-lg text-sm mb-4 outline-none"
          style={{ border: "1px solid var(--color-border)" }}
        />

        {/* 모집 인원 */}
        <label
          className="block text-sm font-semibold mb-1.5"
          style={{ color: "var(--color-text-primary)" }}
        >
          모집 인원
        </label>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setTotal(Math.max(1, total - 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <Minus className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
          </button>
          <span
            className="text-base font-bold w-8 text-center"
            style={{ color: "var(--color-text-primary)" }}
          >
            {total}
          </span>
          <button
            onClick={() => setTotal(total + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <Plus className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>

        {/* 기술 스택 */}
        <label
          className="block text-sm font-semibold mb-1.5"
          style={{ color: "var(--color-text-primary)" }}
        >
          요구 기술 스택
        </label>
        <div className="flex gap-2 mb-2">
          <input
            value={stackInput}
            onChange={(e) => setStackInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStack())}
            placeholder="기술 스택 입력 후 Enter"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: "1px solid var(--color-border)" }}
          />
          <button
            onClick={addStack}
            className="px-3 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer"
            style={{ background: "var(--color-primary-hover)" }}
          >
            추가
          </button>
        </div>
        {stacks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
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
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            취소
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onAdd(name.trim(), total, stacks);
                onClose();
              }
            }}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white cursor-pointer"
            style={{ background: "var(--color-primary-hover)" }}
          >
            추가하기
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── 메인 컴포넌트 ── */
const TeamManagement = ({
  roles: initialRoles,
  members,
  applications: initialApps,
  onAddRole,
  onDeleteRole,
  onUpdateRoleCount,
  onToggleRoleStatus,
  onAccept,
  onReject,
}: TeamManagementProps) => {
  const [roles, setRoles] = useState(initialRoles);
  const [applications, setApplications] = useState(initialApps);
  const [showAddModal, setShowAddModal] = useState(false);

  const totalCurrent = roles.reduce((s, r) => s + r.current, 0);
  const totalAll = roles.reduce((s, r) => s + r.total, 0);
  const pendingCount = applications.filter((a) => a.status === "pending").length;

  const membersByRole = members.reduce<Record<string, Member[]>>((acc, m) => {
    (acc[m.role] ??= []).push(m);
    return acc;
  }, {});

  const handleUpdateCount = (roleId: string, delta: number) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        const newTotal = Math.max(r.current, r.total + delta);
        return {
          ...r,
          total: newTotal,
          status: r.current >= newTotal ? "closed" : r.status,
        };
      }),
    );
    onUpdateRoleCount(roleId, delta);
  };

  const handleToggleStatus = (roleId: string) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId ? { ...r, status: r.status === "open" ? "closed" : "open" } : r,
      ),
    );
    onToggleRoleStatus(roleId);
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    onDeleteRole(roleId);
  };

  const handleAccept = (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: "accepted" as const } : a)),
    );
    // 수락 시 해당 직무 current 증가 → 충원 완료면 자동 마감
    if (app) {
      setRoles((prev) =>
        prev.map((r) => {
          if (r.name !== app.role) return r;
          const newCurrent = r.current + 1;
          return {
            ...r,
            current: newCurrent,
            status: newCurrent >= r.total ? "closed" : r.status,
          };
        }),
      );
    }
    onAccept(appId);
  };

  const handleReject = (appId: string) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: "rejected" as const } : a)),
    );
    onReject(appId);
  };

  const handleAddRole = (name: string, total: number, stacks: string[]) => {
    const newRole: Role = {
      id: `r${Date.now()}`,
      name,
      status: "open",
      current: 0,
      total,
      stacks,
    };
    setRoles((prev) => [...prev, newRole]);
    onAddRole();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── 상단 2열 레이아웃 ── */}
      <div className="grid grid-cols-[1fr_360px] gap-5">
        {/* ── 좌측: 팀원 모집 현황 ── */}
        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3
                className="text-base font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                팀원 모집 현황
              </h3>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {totalCurrent}/{totalAll}명 충원
              </span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer"
              style={{ background: "var(--color-primary-hover)", color: "var(--color-text-primary)" }}
            >
              <UserPlus className="w-4 h-4" />
              직무 추가하기
            </button>
          </div>

          {/* 직무 카드 목록 */}
          <div className="flex flex-col gap-3">
            {roles.map((role) => {
              const color = getRoleColor(role.name);
              const pct = role.total > 0 ? (role.current / role.total) * 100 : 0;
              const isClosed = role.status === "closed";

              return (
                <div
                  key={role.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "4px 4px 4px 0px rgba(0,0,0,0.25)",
                  }}
                >
                  {/* 카드 상단: 직무명 + 상태 뱃지 + 삭제 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold" style={{ color }}>
                      {role.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* 모집 상태 뱃지 (토글) */}
                      <button
                        onClick={() => handleToggleStatus(role.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer"
                        style={{
                          background: isClosed ? "rgba(239,68,68,0.15)" : "rgba(33,150,243,0.15)",
                          border: `1px solid ${isClosed ? "var(--color-error)" : "var(--color-blue)"}`,
                          color: isClosed ? "var(--color-error)" : "var(--color-blue)",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: isClosed ? "var(--color-error)" : "var(--color-blue)" }}
                        />
                        {isClosed ? "모집 마감" : "모집 중"}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {/* 삭제 */}
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 충원 현황 */}
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-sm font-bold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {role.current} / {role.total}명
                    </span>
                    <div
                      className="flex-1 h-[6px] rounded-full overflow-hidden"
                      style={{ background: "#f3f4f6" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 100 ? "var(--color-success)" : color,
                        }}
                      />
                    </div>
                  </div>

                  {/* 요구 스택 */}
                  {role.stacks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {role.stacks.map((stack) => (
                        <span
                          key={stack}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                          style={{
                            background: "var(--color-border)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {stack}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 구분선 + 모집 인원 조정 */}
                  <div
                    className="border-t pt-3 mt-1 flex items-center justify-between"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      모집 인원 조정
                    </span>
                    <div className="flex items-center gap-2">
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 우측: 현재 팀원 ── */}
        <div
          className="rounded-2xl p-5 shadow-sm"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <h3
            className="text-base font-bold mb-4"
            style={{ color: "var(--color-text-primary)" }}
          >
            현재 팀원
          </h3>

          <div className="flex flex-col gap-4">
            {Object.entries(membersByRole).map(([role, roleMembers]) => {
              const color = getRoleColor(role);
              return (
                <div key={role}>
                  {/* 직무 그룹 헤더 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold" style={{ color }}>
                      {role} {roleMembers.length}
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{ background: "var(--color-border)" }}
                    />
                  </div>

                  {/* 팀원 행 */}
                  <div className="flex flex-col gap-1.5">
                    {roleMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg"
                      >
                        {/* 아바타 */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: getAvatarColor(member.name) }}
                        >
                          {member.name.charAt(0)}
                        </div>
                        {/* 이름 + 뱃지 */}
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span
                            className="text-sm font-semibold truncate"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {member.name}
                          </span>
                          {member.isMe && (
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              (나)
                            </span>
                          )}
                          {member.isLeader && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                              style={{
                                background: "rgba(245,158,11,0.2)",
                                color: "#F59E0B",
                              }}
                            >
                              팀장
                            </span>
                          )}
                        </div>
                        {/* 가입일 */}
                        <span
                          className="text-xs flex-shrink-0"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          {member.joinDate}
                        </span>
                        {/* 기여도 */}
                        <span
                          className="text-xs font-bold flex-shrink-0 w-10 text-right"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {member.contribution}c
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 하단: 합류 신청 목록 ── */}
      <div
        className="rounded-2xl p-5 shadow-sm"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-base font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            합류 신청 목록
          </h3>
          {pendingCount > 0 && (
            <span
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                background: "rgba(239,68,68,0.15)",
                color: "var(--color-error)",
              }}
            >
              {pendingCount}건 대기 중
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {applications.map((app) => {
            const color = getRoleColor(app.role);
            const isPending = app.status === "pending";
            const isAccepted = app.status === "accepted";

            return (
              <div
                key={app.id}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl"
                style={{
                  background: "#fafafa",
                  border: "1px solid var(--color-border)",
                }}
              >
                {/* 아바타 */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: getAvatarColor(app.name) }}
                >
                  {app.name.charAt(0)}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-sm font-bold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {app.name}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                      style={{ background: `${color}20`, color }}
                    >
                      {app.role}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {app.appliedAt}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {app.stacks.map((stack) => (
                      <span
                        key={stack}
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                        style={{
                          background: "var(--color-border)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {stack}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isPending ? (
                    <>
                      <button
                        onClick={() => handleAccept(app.id)}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white cursor-pointer"
                        style={{ background: "var(--color-success)" }}
                      >
                        수락
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
                        style={{
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        거절
                      </button>
                    </>
                  ) : isAccepted ? (
                    <>
                      <button
                        disabled
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white"
                        style={{ background: "var(--color-text-tertiary)", cursor: "not-allowed" }}
                      >
                        수락됨
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white cursor-pointer"
                        style={{ background: "var(--color-error)" }}
                      >
                        거절
                      </button>
                    </>
                  ) : (
                    <span
                      className="px-4 py-2 rounded-lg text-xs font-bold"
                      style={{ color: "var(--color-error)" }}
                    >
                      거절됨
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 직무 추가 모달 ── */}
      {showAddModal && (
        <AddRoleModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddRole}
        />
      )}
    </div>
  );
};

/* ── 기본 export ── */
const TeamMembers = ({ dashboard }: { dashboard?: TeamDashboard | null }) => {
  const roles = useMemo(
    () => (dashboard ? dashboardToRoles(dashboard) : []),
    [dashboard],
  );
  const members = useMemo(
    () => (dashboard ? dashboardToMembers(dashboard) : []),
    [dashboard],
  );

  return (
    <TeamManagement
      projectName={dashboard?.projectInfo.title ?? "프로젝트"}
      roles={roles}
      members={members}
      applications={[]}
      onAddRole={() => console.log("직무 추가")}
      onDeleteRole={(id) => console.log("직무 삭제:", id)}
      onUpdateRoleCount={(id, delta) => console.log("인원 변경:", id, delta)}
      onToggleRoleStatus={(id) => console.log("상태 토글:", id)}
      onAccept={(id) => console.log("수락:", id)}
      onReject={(id) => console.log("거절:", id)}
    />
  );
};

export default TeamMembers;
export { TeamManagement };
export type { Role, Member, Application, TeamManagementProps };
