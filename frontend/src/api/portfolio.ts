import api from './index';

export interface PortfolioGenerateRequest {
  tsIds: number[];
}

export interface PortfolioGenerateResult {
  portfolioId: number;
  s3Url: string;
  title: string;
  isPublic: boolean;
}

export interface PortfolioSummary {
  portfolioId: number;
  title: string;
  s3Url: string;
  isPublic: boolean;
  updatedAt: string;
}

/** POST /v1/portfolios/generate — AI 포트폴리오 생성 */
export const generatePortfolio = (data: PortfolioGenerateRequest) =>
  api.post<{ data: PortfolioGenerateResult }>('/v1/portfolios/generate', data, { timeout: 120000 });

/** GET /v1/portfolios — 내 포트폴리오 목록 */
export const getMyPortfolios = () =>
  api.get<{ data: PortfolioSummary[] }>('/v1/portfolios');

/** GET /v1/portfolios/{id}/download — 포트폴리오 다운로드 (마크다운) */
export const downloadPortfolio = (portfolioId: number) =>
  api.get<string>(`/v1/portfolios/${portfolioId}/download`, {
    responseType: 'text' as never,
  });

/** PATCH /v1/portfolios/{id}/title — 포트폴리오 제목 수정 */
export const updatePortfolioTitle = (portfolioId: number, title: string) =>
  api.patch(`/v1/portfolios/${portfolioId}/title`, { title });

/** DELETE /v1/portfolios/{id} — 포트폴리오 삭제 */
export const deletePortfolioApi = (portfolioId: number) =>
  api.delete(`/v1/portfolios/${portfolioId}`);

/** 브라우저에서 .md 파일로 저장 */
export const savePortfolioAsFile = async (portfolioId: number, fileName = '포트폴리오.md') => {
  const { data } = await downloadPortfolio(portfolioId);
  const text = typeof data === 'string' ? data : new TextDecoder().decode(data as unknown as ArrayBuffer);
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
