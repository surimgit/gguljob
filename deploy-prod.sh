#!/bin/bash

# ==============================================================================
# [PRODUCTION Blue/Green Deployment Script]
# ==============================================================================

# [설정] 운영 환경 파일명 및 컨테이너 이름 규칙 정의
DOCKER_COMPOSE_FILE="docker-compose.prod.yml" # 운영용 컴포즈 파일
SERVICE_PREFIX="backend"                    # docker compose 서비스명 접두사 (compose 파일 기준)
CONTAINER_PREFIX="gguljob-backend-prod"     # 실제 컨테이너명 접두사 (docker exec/ps 기준)
NGINX_CONTAINER="gguljob-nginx-prod"        # 운영용 Nginx 컨테이너 이름
SERVICE_URL_INC="./nginx/conf.d/service-url.inc"

echo "🚀 [Prod Deploy] Starting Production Blue/Green deployment..."

# 0. Docker Compose 명령어 감지
if docker compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker compose"
else
    DOCKER_CMD="docker-compose"
fi
echo "🛠 [Config] Using command: $DOCKER_CMD"

# 1. 현재 실행 중인 컨테이너 색상 확인
IS_BLUE=$(docker ps --format "{{.Names}}" | grep "${CONTAINER_PREFIX}-blue")

if [ -z "$IS_BLUE" ]; then
    echo "🎯 [Target] Current: Green (or None) -> Deploying: BLUE"
    CURRENT_COLOR="green"
    NEW_COLOR="blue"
else
    echo "🎯 [Target] Current: Blue -> Deploying: GREEN"
    CURRENT_COLOR="blue"
    NEW_COLOR="green"
fi

# 2. 새 컨테이너 빌드 및 실행
echo "🐳 [Docker] Starting $NEW_COLOR container..."

# [청소] 혹시 남아있을지 모르는 좀비 컨테이너 제거
echo "🧹 [Clean] Removing pending $NEW_COLOR container..."
docker rm -f ${CONTAINER_PREFIX}-${NEW_COLOR} 2>/dev/null || true

# [실행] --no-deps: DB 등 주변기기 건드리지 않고 백엔드만 띄움
# 주의: docker-compose.yml 서비스 명도 'backend-blue', 'backend-green' 이어야 합니다.
echo "🚀 [Start] Booting up backend-${NEW_COLOR}..."
$DOCKER_CMD -f $DOCKER_COMPOSE_FILE --env-file .env-prod up -d --build --no-deps ${SERVICE_PREFIX}-${NEW_COLOR}

# 3. 헬스 체크 (Health Check)
echo "🏥 [Health Check] Waiting for server to be ready..."
sleep 20

for i in {1..10}; do
    # 컨테이너 내부 8080 포트로 헬스 체크 (Nginx 거치지 않음)
    CHECK_CMD="curl -s -o /dev/null -w %{http_code} http://127.0.0.1:8080/api/v1/health"
    
    if docker exec ${CONTAINER_PREFIX}-${NEW_COLOR} curl -s http://127.0.0.1:8080/api/v1/health >/dev/null 2>&1; then
        HTTP_CODE=$(docker exec ${CONTAINER_PREFIX}-${NEW_COLOR} curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/v1/health)
    else
        HTTP_CODE=000
    fi
    
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
        echo "✅ [Health Check] $NEW_COLOR is ready! (Status: $HTTP_CODE)"
        break
    else
        echo "⏳ [Health Check] Waiting... ($i/10) (Status: $HTTP_CODE)"
        sleep 5
    fi

    if [ "$i" -eq 10 ]; then
        echo "❌ [Error] $NEW_COLOR failed to respond."
        echo "📜 [Log Tail] Checking logs..."
        docker logs --tail 20 ${CONTAINER_PREFIX}-${NEW_COLOR}
        docker stop ${CONTAINER_PREFIX}-${NEW_COLOR}
        exit 1
    fi
done

# 4. Nginx 스위칭 (동적 변경)
echo "📝 [Nginx] Switching traffic to $NEW_COLOR..."
# 운영용 Nginx 컨테이너 내부의 설정 파일을 덮어씁니다.
echo "set \$service_url http://${CONTAINER_PREFIX}-${NEW_COLOR}:8080;" | docker exec -i $NGINX_CONTAINER tee /etc/nginx/conf.d/service-url.inc > /dev/null

# 5. Nginx 설정 검증
echo "🧪 [Nginx] Validating configuration..."
if ! docker exec $NGINX_CONTAINER nginx -t; then
    echo "❌ [Error] Nginx config test failed. Aborting reload."
    exit 1
fi

# 6. Nginx 리로드
echo "🔄 [Nginx] Reloading configuration..."
docker exec $NGINX_CONTAINER nginx -s reload

# 7. 구 버전 컨테이너 정리
echo "🛑 [Stop] Stopping old version ($CURRENT_COLOR)..."
docker stop ${CONTAINER_PREFIX}-${CURRENT_COLOR} 2>/dev/null || true
docker rm ${CONTAINER_PREFIX}-${CURRENT_COLOR} 2>/dev/null || true

echo "🎉 [Success] Production deployment completed! Active: $NEW_COLOR"