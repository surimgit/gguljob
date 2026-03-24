import api from './index';

export interface PortfolioSummary {
  portfolioId: number;
  title: string;
  s3Url: string;
  isPublic: boolean;
  updatedAt: string;
}

export const getMyPortfolios = () =>
  api.get<{ status: number; message: string; data: PortfolioSummary[] }>('/v1/portfolios');
