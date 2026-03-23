# Jenkins + Docker CLI 설치
# Jenkins가 호스트 Docker 소켓(/var/run/docker.sock)을 사용해 컨테이너를 직접 제어할 수 있게 함
#
# [주의사항]
# - lts-jdk21: 백엔드가 Java 21을 사용하므로 Jenkins도 반드시 JDK 21이어야 함
# - docker-compose-plugin: docker compose V2 명령어를 위해 반드시 함께 설치
# - DOCKER_GID: 호스트 docker 그룹 GID와 맞춰야 소켓 권한이 정상 작동함
#   (EC2에서 `stat -c '%g' /var/run/docker.sock` 으로 GID 확인 가능, 보통 999)
FROM jenkins/jenkins:lts-jdk21

USER root

# [빌드 arg] 호스트 docker 그룹 GID (기본값 999)
# docker-compose build 시 --build-arg DOCKER_GID=$(stat -c '%g' /var/run/docker.sock) 로 주입 가능
ARG DOCKER_GID=999

# Docker CLI + Compose Plugin 설치
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    lsb-release && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/debian \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    docker-ce-cli \
    docker-compose-plugin \
    docker-buildx-plugin && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# docker 그룹 생성 (이미 존재하면 무시) 후 jenkins 유저 추가
# → docker-compose.prod.yml의 'user: root' 를 제거하고 이 방식으로 권한 관리 권장
RUN groupadd -f -g ${DOCKER_GID} docker && \
    usermod -aG docker jenkins

# Jenkins 플러그인 설치 (jenkins-plugin-cli 사용)
# USER root 상태에서 설치 후 jenkins 유저로 전환
RUN jenkins-plugin-cli --plugins \
    # GitLab 연동 (Webhook 트리거)
    gitlab-plugin \
    # 파이프라인 핵심
    workflow-aggregator \
    # Git
    git \
    # Mattermost 알림
    mattermost \
    # 파이프라인에서 Credentials 사용
    credentials-binding \
    # 브랜치별 멀티브랜치 파이프라인
    multibranch-scan-webhook-trigger

USER jenkins
