import { useQuery } from '@tanstack/react-query';
import { getProjects, getProjectById } from '../api/projects';

export const useProjects = (params?: { page?: number; techStack?: string; status?: string }) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => getProjects(params).then((res) => res.data),
  });
};

export const useProjectDetail = (id: number) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectById(id).then((res) => res.data),
    enabled: !!id,
  });
};
