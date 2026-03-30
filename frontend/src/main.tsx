import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 브라우저의 자동 스크롤 복원 비활성화 (ScrollToTop이 직접 관리)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
