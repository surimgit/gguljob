import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react(), tailwindcss()],
        server: {
            port: 5173,
            proxy: {
                // SSE 엔드포인트 — 버퍼링 비활성화 필수
                '/api/v1/notifications/subscribe': {
                    target: env.VITE_API_TARGET || 'https://j14e107.p.ssafy.io:8443',
                    changeOrigin: true,
                    secure: false,
                    // SSE는 청크 단위로 즉시 전달해야 함
                    configure: (proxy) => {
                        proxy.on('proxyRes', (proxyRes) => {
                            if (proxyRes.headers['content-type']?.includes('text/event-stream')) {
                                proxyRes.headers['cache-control'] = 'no-cache';
                                proxyRes.headers['x-accel-buffering'] = 'no';
                            }
                        });
                    },
                },
                // 개발 환경에서 API 요청을 백엔드 서버로 프록시
                '/api': {
                    target: env.VITE_API_TARGET || 'https://j14e107.p.ssafy.io:8443',
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
    };
});
