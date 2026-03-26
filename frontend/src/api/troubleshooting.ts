import api from './index';

export interface TroubleshootingListItem {
  tsId: number;
  title: string;
  situation: string;
  solution: string;
  code_snippet: string;
  prId: string;
  prNum: string;
  prTitle: string;
  createdAt: string;
}

export interface TroubleshootingPage {
  content: TroubleshootingListItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const getTroubleshootings = (projectId: number, page = 0, size = 10) =>
  api.get<TroubleshootingPage>(`/v1/projects/${projectId}/personal-space/troubleshootings`, {
    params: { page, size },
  });

export const generateTroubleshooting = (prId: number, projectId: number) =>
  api.post('/v1/troubleshooting/generate', { prId, projectId }, { timeout: 120000 });

export const updateTroubleshooting = (
  troubleshootingId: number,
  data: { title: string; situation: string; solution: string; codeSnippet: string }
) =>
  api.put(`/v1/troubleshooting/${troubleshootingId}`, data);

export interface ChatTroubleRequest {
  projectId: number;
  userMessage: string;
}

export interface ChatTroubleResponse {
  aiAnswer: string;
}

export const chatTrouble = (data: ChatTroubleRequest) =>
  api.post<ChatTroubleResponse>('/v1/ai/chat/trouble', data);

export interface TroubleshootingWidget {
  tsId: number;
  title: string;
  solution: string;
  projectId: number;
  createdAt: string;
}

export const getMyTroubleshootingWidget = () =>
  api.get<{ status: number; message: string; data: TroubleshootingWidget[] }>('/v1/user/me/troubleshootings/widget');

/** 마이페이지 트러블슈팅 목록 조회 (페이지네이션) */
export interface MyTroubleshootingItem {
  tsId: number;
  title: string;
  description: string;
  solution: string | null;
  codeSnippet: string | null;
  projectId: number;
  projectName: string;
  createdAt: string;
}

export interface MyTroubleshootingPage {
  content: MyTroubleshootingItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const getMyTroubleshootings = (page = 0, size = 5) =>
  api.get<MyTroubleshootingPage>('/v1/troubleshooting/my', { params: { page, size } });