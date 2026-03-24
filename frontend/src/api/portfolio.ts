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
