#!/bin/bash

# ==============================================================================
# [DEVELOP Blue/Green Deployment Script]
# ==============================================================================

# 호스트 경로는 참조용 변수일 뿐, 실제 업데이트는 컨테이너 내부로 직접 쏩니다.
DOCKER_COMPOSE_FILE="docker-compose.dev.yml" # 개발용 컴포즈 파일
SERVICE_PREFIX="backend-dev"                 # docker compose 서비스명 접두사 (compose 파일 기준)
CONTAINER_PREFIX="gguljob-backend-dev"       # 실제 컨테이너명 접두사 (docker exec/ps 기준)
NGINX_CONTAINER="gguljob-nginx-dev"          # 개발용 Nginx 컨테이너 이름
SERVICE_URL_INC="./nginx/conf.d-dev/service-url.inc"

echo "🚀 [Develop Deploy] Starting Development Blue/Green deployment..."

# 0. Docker Compose 명령어 감지
if docker compose version >/dev/null 2>&1; then
    DOCKER_CMD="docker compose"
else
    DOCKER_CMD="docker-compose"
fi
echo "🛠 [Config] Using command: $DOCKER_CMD"

# 1. 현재 실행 중인 컨테이너 확인
IS_BLUE=$(docker ps --format "{{.Names}}" | grep "${CONTAINER_PREFIX}-blue")

if [ -z "$IS_BLUE" ]; then
    echo "🎯 [Target] Current: Green (or None) -> Deploying: BLUE"
    CURRENT_COLOR="green"
    NEW_COLOR="blue"
    NEW_PORT=8081
else
    echo "🎯 [Target] Current: Blue -> Deploying: GREEN"
    CURRENT_COLOR="blue"
    NEW_COLOR="green"
    NEW_PORT=8082
fi

# 2. 새 컨테이너 빌드 및 실행
echo "🐳 [Docker] Starting $NEW_COLOR container..."

# [청소] 배포할 자리에 있는 좀비 컨테이너 제거 (충돌 방지)
echo "🧹 [Clean] Removing pending $NEW_COLOR container..."
docker rm -f ${CONTAINER_PREFIX}-${NEW_COLOR} 2>/dev/null || true

# [실행] --no-deps로 DB 재시작 방지
echo "🚀 [Start] Booting up $NEW_COLOR..."
$DOCKER_CMD -f $DOCKER_COMPOSE_FILE up -d --build --no-deps ${SERVICE_PREFIX}-${NEW_COLOR}

# 3. 헬스 체크 (Health Check)
echo "🏥 [Health Check] Waiting for server to be ready..."
# 귀하의 서버 부팅 시간(약 20초)을 고려하여 넉넉히 25초 대기
sleep 25

for i in {1..10}; do
    # [핵심] 컨테이너 내부(8080)에서 직접 헬스 체크
    
    # 1. curl 시도
    if docker exec ${CONTAINER_PREFIX}-${NEW_COLOR} curl -s http://127.0.0.1:8080/api/v1/health >/dev/null 2>&1; then
        HTTP_CODE=$(docker exec ${CONTAINER_PREFIX}-${NEW_COLOR} curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/v1/health)
    # 2. wget 시도 (혹시 몰라 예비용)
    elif docker exec ${CONTAINER_PREFIX}-${NEW_COLOR} wget -q --spider http://127.0.0.1:8080/api/v1/health >/dev/null 2>&1; then
        HTTP_CODE=200
    else
        HTTP_CODE=000
    fi
    
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
        echo "✅ [Health Check] $NEW_COLOR is ready! (Internal Check: $HTTP_CODE)"
        break
    else
        echo "⏳ [Health Check] Waiting... ($i/10) (HTTP Code: $HTTP_CODE)"
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

# 4. Nginx 설정 파일 업데이트 (직접 주입 방식)
echo "📝 [Nginx] Updating service-url.inc directly into container..."
# 젠킨스가 호스트 파일을 못 건드려도, Nginx 컨테이너 내부 파일은 건드릴 수 있음 (tee 사용)
echo "set \$service_url http://${CONTAINER_PREFIX}-${NEW_COLOR}:8080;" | docker exec -i $NGINX_CONTAINER tee /etc/nginx/conf.d/service-url.inc > /dev/null

# 5. Nginx 설정 검증
echo "🧪 [Nginx] Validating configuration..."
if ! docker exec $NGINX_CONTAINER nginx -t; then
    echo "❌ [Error] Nginx config test failed. Aborting reload."
    exit 1
fi

# 6. Nginx 리로드
echo "🔄 [Nginx] Reloading configuration..."
# Nginx 컨테이너 이름 확인 (gguljob-nginx-dev)
docker exec $NGINX_CONTAINER nginx -s reload

# 7. 구 버전 컨테이너 정리
echo "🛑 [Stop] Stopping old version ($CURRENT_COLOR)..."
if [ "$CURRENT_COLOR" == "blue" ]; then
    OLD_CONTAINER="${CONTAINER_PREFIX}-blue"
else
    OLD_CONTAINER="${CONTAINER_PREFIX}-green"
fi

# 깔끔하게 삭제까지 수행
docker stop $OLD_CONTAINER 2>/dev/null || true
docker rm $OLD_CONTAINER 2>/dev/null || true

echo "🎉 [Success] Develop Deployment completed! Active server: $NEW_COLOR"