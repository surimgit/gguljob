# GGulJob (꿀잡)

개발 직군 취업준비생을 위한 AI 기반 올인원 채용 로드맵 플랫폼

SSAFY 2학기 자율 프로젝트 - 영철부지 팀

---

## 프로젝트 소개

GGulJob은 개발자들이 프로젝트 팀원을 찾고, 맞춤형 채용 공고를 추천받으며, AI 챗봇을 통해 커리어 관련 질문을 할 수 있는 웹 플랫폼입니다.

### 주요 기능 (이미지 추가 예정)

- **프로젝트 탐색 및 팀 빌딩** - 오픈 프로젝트를 검색하고, 포지션에 맞는 팀원 모집/지원
- **팀원 추천** - Neo4j 그래프 기반 매칭 (기술 스택, 목표, MBTI, 역할, 경력 수준)
- **채용 공고 추천** - JobKorea 크롤링 데이터 기반, 벡터 유사도로 개인 맞춤 추천
- **GitHub 연동** - 프로젝트에 GitHub 레포지토리 연결, PR 이력 동기화 및 실시간 Webhook
- **AI 챗봇** - Claude 기반 인앱 챗봇 (레이트 리밋, 캐싱 적용)
- **트러블슈팅 게시판** - 개발 중 겪은 문제/해결 과정 공유
- **포트폴리오 관리** - 사용자 포트폴리오 작성 및 조회
- **알림 시스템** - 이벤트 기반 인앱 알림 (가입 요청, PR 활동 등)

---

## 기술 스택

### Frontend

| 기술             | 버전 | 역할                     |
| ---------------- | ---- | ------------------------ |
| React            | 19.2 | UI 프레임워크            |
| TypeScript       | 5.9  | 타입 안전성              |
| Vite             | 7.3  | 빌드 도구                |
| Tailwind CSS     | 4.2  | 스타일링                 |
| React Router DOM | 7.13 | 클라이언트 사이드 라우팅 |
| Zustand          | 5.0  | 클라이언트 상태 관리     |
| Axios            | 1.13 | HTTP 클라이언트          |

### Backend

| 기술                    | 버전 | 역할                 |
| ----------------------- | ---- | -------------------- |
| Spring Boot             | 4    | 핵심 프레임워크      |
| Java                    | 21   | 언어                 |
| Spring Data JPA + MySQL | 8.0  | 관계형 데이터 저장소 |
| Spring Data Neo4j       | 5.15 | 그래프 기반 매칭     |
| Redis                   | -    | 캐싱, 레이트 리밋    |
| Spring Security + JWT   | -    | 인증/인가            |
| AWS S3                  | -    | 이미지 저장소        |
| Springdoc OpenAPI       | -    | API 문서             |

### AI / Data

| 기술                       | 역할                         |
| -------------------------- | ---------------------------- |
| Python                     | 크롤러 및 배치 스크립트      |
| OpenAI Embedding API (GMS) | 사용자/공고 벡터 임베딩 생성 |
| Claude API (GMS)           | AI 챗봇                      |

### Infra

| 기술                    | 역할                 |
| ----------------------- | -------------------- |
| Docker / Docker Compose | 컨테이너 관리        |
| Nginx                   | 리버스 프록시, HTTPS |
| Jenkins                 | CI/CD 파이프라인     |
| Blue/Green 배포         | 무중단 배포          |

---

## 프로젝트 구조

```
S14P21E107/
├── frontend/                # React + Vite SPA
│   ├── src/
│   │   ├── api/             # API 호출 함수
│   │   ├── components/
│   │   │   ├── common/      # 공통 컴포넌트 (Badge, Button, Card, Modal 등)
│   │   │   ├── feature/     # 기능별 컴포넌트
│   │   │   │   ├── auth/    # 로그인, 온보딩
│   │   │   │   ├── detail/  # 프로젝트 상세 탭
│   │   │   │   ├── mypage/  # 마이페이지
│   │   │   │   ├── project/ # 프로젝트 카드, 필터, 설정
│   │   │   │   ├── recruitment/     # 채용 추천
│   │   │   │   ├── team-recommend/  # 팀원 추천
│   │   │   │   └── notification/    # 알림
│   │   │   ├── home/        # 랜딩 페이지 섹션
│   │   │   └── layout/      # Navbar, Footer, Layout
│   │   ├── pages/           # 라우트별 페이지 컴포넌트
│   │   ├── stores/          # Zustand 스토어
│   │   ├── types/           # TypeScript 타입 정의
│   │   ├── hooks/           # 커스텀 훅
│   │   ├── constants/       # 상수 (도메인, 스킬 목록)
│   │   └── utils/           # 유틸리티 함수
│   └── ...
│
├── backend/                 # Spring Boot REST API
│   └── src/main/java/com/ssafy/gguljob/backend/
│       ├── domain/
│       │   ├── ai/          # AI 챗봇, 임베딩, 추천
│       │   ├── github/      # GitHub Webhook, PR 동기화
│       │   ├── job/         # 채용 공고, 북마크, 추천
│       │   ├── join/        # 프로젝트 가입 요청
│       │   ├── matching/    # Neo4j 그래프 매칭
│       │   ├── notification/# 알림
│       │   ├── oauth/       # GitHub OAuth 로그인
│       │   ├── project/     # 프로젝트 CRUD, 멤버 관리
│       │   ├── skill/       # 기술 스택 엔티티
│       │   ├── troubleshooting/ # 트러블슈팅 게시판
│       │   └── user/        # 사용자 프로필, 포트폴리오
│       └── global/          # 공통 설정, 인증, 예외 처리
│
├── ai/
│   ├── crawler/             # JobKorea 채용 공고 크롤러
│   └── batch/               # 배치 스크립트 (임베딩, 메타데이터 업데이트)
│
├── nginx/                   # Nginx 설정 (dev/prod)
├── jenkins_docker/          # Jenkins CI/CD Docker 설정
├── docker-compose.dev.yml   # 개발 환경 구성
├── docker-compose.prod.yml  # 운영 환경 구성
├── Jenkinsfile-fe-dev       # 프론트 개발 배포 파이프라인
├── Jenkinsfile-fe-prod      # 프론트 운영 배포 파이프라인
├── Jenkinsfile-be-dev       # 백엔드 개발 배포 파이프라인
├── Jenkinsfile-be-prod      # 백엔드 운영 배포 파이프라인
├── deploy.sh                # 개발 배포 스크립트
└── deploy-prod.sh           # 운영 배포 스크립트
```

---

## 아키텍처

```
[Client Browser]
       |
    [Nginx] ── HTTPS 리버스 프록시
     /    \
[React SPA]  [Spring Boot API]
               /     |     \
         [MySQL]  [Neo4j]  [Redis]
                     |
              [그래프 매칭 엔진]

[Python Crawler] → JobKorea → [MySQL]
[Python Batch]   → GMS API  → [Neo4j 임베딩]
```

---

## 환경 설정

### 개발 환경 실행

```bash
# Docker Compose로 전체 서비스 실행
docker compose -f docker-compose.dev.yml up -d

# 프론트엔드 로컬 개발
cd frontend
npm install
npm run dev

# 백엔드 로컬 개발
cd backend
./gradlew bootRun --args='--spring.profiles.active=dev'
```

### 주요 포트 (개발 환경)

| 서비스          | 포트        |
| --------------- | ----------- |
| Frontend (Vite) | 5173        |
| Backend (Blue)  | 8081        |
| Backend (Green) | 8082        |
| Nginx           | 8000 / 8443 |
| MySQL           | 3307        |
| Neo4j Browser   | 7475        |
| Neo4j Bolt      | 7688        |
| Redis           | 6379        |

---

## 배포

Blue/Green 무중단 배포를 적용하여 서비스 중단 없이 새 버전을 배포합니다.

- Jenkins 파이프라인이 GitLab 푸시를 감지하여 자동 빌드/배포
- Nginx가 Blue/Green 인스턴스 간 트래픽을 전환
- 배포 결과는 Mattermost 채널로 알림

---

## 팀 E107
