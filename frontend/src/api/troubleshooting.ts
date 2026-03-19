import api from './index';

export const generateTroubleshooting = (prId: number) =>
  api.post('/v1/troubleshooting/generate', { prId });

export const updateTroubleshooting = (
  troubleshootingId: number,
  data: { title: string; situation: string; solution: string; codeSnippet: string }
) =>
  api.put(`/v1/troubleshooting/${troubleshootingId}`, data);