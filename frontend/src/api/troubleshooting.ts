import api from './index';

export interface TroubleshootingListItem {
  tsId: number;
  title: string;
  situation: string;
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

export const generateTroubleshooting = (prId: number) =>
  api.post('/v1/troubleshooting/generate', { prId });

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
  createdAt: string;
}

export const getMyTroubleshootingWidget = () =>
  api.get<{ status: number; message: string; data: TroubleshootingWidget[] }>('/v1/user/me/troubleshootings/widget');