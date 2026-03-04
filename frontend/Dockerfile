# =========================================================
# 1단계: 빌드 환경 (Builder Stage) - Node.js
# =========================================================
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 설치 (캐싱 최적화)
COPY package.json package-lock.json ./
RUN npm ci

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build
# Vite로 빌드하면 결과물은 'dist' 폴더에 생성

# =========================================================
# 2단계: 실행 환경 (Production Stage) - Nginx
# =========================================================
FROM nginx:alpine

# 1단계에서 빌드된 결과물(정적 파일들)만 쏙 빼서 Nginx 경로로 옮김
# 팩트: /app/dist 폴더를 가져와야 합니다.
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA 라우팅을 위한 Nginx 설정 파일 복사
# (이 파일은 바로 아래 단계에서 만들 것입니다)
COPY default.conf /etc/nginx/conf.d/default.conf

# 80번 포트 노출 (도커 내부 통신용)
EXPOSE 80

# Nginx 실행 (데몬 끄고 포그라운드 실행)
CMD ["nginx", "-g", "daemon off;"]