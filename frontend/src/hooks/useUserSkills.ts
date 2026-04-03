import { useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';

/** 유저의 기술 스택 이름 목록을 반환하는 훅 */
export const useUserSkills = (): string[] => {
  const user = useAuthStore((s) => s.user);
  return useMemo(() => {
    if (!user) return [];
    return user.techStacks?.length ? user.techStacks : (user.skills?.map((s) => s.name) ?? []);
  }, [user]);
};

/** 유저의 기술 스택 이름을 Set으로 반환하는 훅 */
export const useUserSkillSet = (): Set<string> => {
  const skills = useUserSkills();
  return useMemo(() => new Set(skills), [skills]);
};
