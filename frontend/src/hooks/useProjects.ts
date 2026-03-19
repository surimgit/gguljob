import { useQuery } from '@tanstack/react-query';
import { getProjects, getRecommendedProjects, getProjectFilters } from '../api/projects';
import type { ProjectListParams } from '../types/project';

export const useProjects = (params?: ProjectListParams) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => getProjects(params).then((res) => res.data),
    placeholderData: (prev) => prev,
  });
};

export const useRecommendedProjects = () => {
  return useQuery({
    queryKey: ['projects', 'recommended'],
    queryFn: () => getRecommendedProjects().then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });
};

export const useProjectFilters = () => {
  return useQuery({
    queryKey: ['projects', 'filters'],
    queryFn: () => getProjectFilters().then((res) => res.data),
    staleTime: 10 * 60 * 1000,
  });
};
