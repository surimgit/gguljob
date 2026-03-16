-- 부모 테이블 (다른 테이블을 참조하지 않는 독립적인 테이블)

CREATE TABLE `users` (
    `user_id` BIGINT AUTO_INCREMENT NOT NULL COMMENT '사용자 고유 식별번호',
    `user_name` VARCHAR(20) NULL COMMENT '사용자명',
    `email` VARCHAR(100) NOT NULL COMMENT '이메일(계정 식별용)',
    `description` VARCHAR(255) NULL COMMENT '프로필 한줄 소개 (기존 Field2)',
    `mbti` VARCHAR(4) NULL COMMENT '사용자 MBTI 성향',
    `role` VARCHAR(20) NULL COMMENT '선호 개발 포지션(BACKEND, FRONTEND)',
    `experience` VARCHAR(50) NULL COMMENT '개발 경험 (입문/초급/중급/고급)',
    `team_tendency` VARCHAR(50) NULL COMMENT '팀 내 성향 (팔로워/리더)',
    `profile_image_url` VARCHAR(255) NULL COMMENT '프로필 이미지 URL (기존 Field)',
    'authority' VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER' COMMENT '시스템 접근 권한(ROLE_USER, ROLE_ADMIN)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '계정 생성 시간',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '계정 수정 시간',
    PRIMARY KEY (`user_id`)
);

CREATE TABLE `skill` (
    `skill_id` BIGINT AUTO_INCREMENT NOT NULL COMMENT '스킬 ID',
    `name` VARCHAR(50) NOT NULL COMMENT '스킬명 (예: Java, Spring Boot)',
    `synonyms` VARCHAR(255) NULL COMMENT '유의어 (Neo4j 및 검색용)',
    `category` VARCHAR(50) NULL COMMENT '분류 (BACKEND, FRONTEND 등)',
    `icon_url` VARCHAR(255) NULL COMMENT '프론트엔드 렌더링용 로고 URL',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`skill_id`)
);

CREATE TABLE `job_posting` (
    `posting_id` BIGINT AUTO_INCREMENT NOT NULL,
    `company_name` VARCHAR(100) NOT NULL COMMENT '공고 기업',
    `title` VARCHAR(200) NOT NULL COMMENT '공고 제목',
    `hyperlink` VARCHAR(200) NULL COMMENT '하이퍼링크 주소',
    `position_details` TEXT NULL COMMENT '포지션 상세',
    `main_tasks` TEXT NULL COMMENT '주요 업무',
    `requirements` TEXT NULL COMMENT '자격요건',
    `preferred_points` TEXT NULL COMMENT '우대사항',
    `deadline` DATETIME NULL COMMENT '마감일(상시채용은 NULL)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`posting_id`)
);

-- 자식 테이블 (유저, 프로젝트 등에 의존하는 테이블)

CREATE TABLE `projects` (
    `project_id` BIGINT AUTO_INCREMENT NOT NULL,
    `leader_id` BIGINT NOT NULL COMMENT '팀장 ID',
    `team_name` VARCHAR(50) NULL COMMENT '팀 이름',
    `title` VARCHAR(100) NOT NULL COMMENT '프로젝트 명',
    `domain` VARCHAR(50) NULL COMMENT '프로젝트 도메인',
    `description` TEXT NULL COMMENT '상세 주제',
    `status` VARCHAR(20) DEFAULT 'RECRUITING' COMMENT 'RECRUITING, PROCEEDING, DONE',
    `is_public` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '프로젝트 공개/비공개',
    `image_url` VARCHAR(255) NULL COMMENT '프로젝트 대표 이미지 url',
    `document_url` VARCHAR(255) NULL COMMENT '요구사항 명세서 url',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `finished_at` DATETIME NULL COMMENT '프로젝트 종료 시간 (DONE)',
    PRIMARY KEY (`project_id`),
    FOREIGN KEY (`leader_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
);

CREATE TABLE `oauth_providers` (
    `oauth_id` BIGINT AUTO_INCREMENT NOT NULL COMMENT '소셜 인증 고유 ID',
    `user_id` BIGINT NOT NULL,
    `provider` VARCHAR(20) NOT NULL COMMENT 'KAKAO, GOOGLE, GITHUB',
    `provider_account_id` VARCHAR(100) NOT NULL COMMENT '소셜 서버 고유 식별자',
    `access_token` VARCHAR(255) NULL COMMENT 'GitHub Repo 접근용 토큰',
    PRIMARY KEY (`oauth_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
);

CREATE TABLE `portfolios` (
    `portfolio_id` BIGINT AUTO_INCREMENT NOT NULL COMMENT '포트폴리오 고유 ID',
    `user_id` BIGINT NOT NULL COMMENT '사용자 고유 식별번호',
    `title` VARCHAR(200) NOT NULL COMMENT '포트폴리오 제목',
    `s3_url` VARCHAR(512) NOT NULL COMMENT '포트폴리오 S3 파일 URL',
    `is_public` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '공개 여부 (TRUE: 공개, FALSE: 비공개)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '생성 날짜',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 날짜',
    PRIMARY KEY (`portfolio_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
);

CREATE TABLE `user_skill` (
    `user_skill_id` BIGINT AUTO_INCREMENT NOT NULL COMMENT '사용자 스킬 ID',
    `user_id` BIGINT NOT NULL COMMENT '사용자 고유 식별번호',
    `skill_id` BIGINT NOT NULL COMMENT '스킬 ID',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_skill_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`skill_id`) REFERENCES `skill` (`skill_id`) ON DELETE CASCADE
);

CREATE TABLE `job_bookmark` (
    `bookmark_id` BIGINT AUTO_INCREMENT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `posting_id` BIGINT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`bookmark_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`posting_id`) REFERENCES `job_posting` (`posting_id`) ON DELETE CASCADE
);

CREATE TABLE `job_user_similarities` (
    `similarity_id` BIGINT AUTO_INCREMENT NOT NULL COMMENT '공고 유사도 고유 ID',
    `posting_id` BIGINT NOT NULL COMMENT '대상 채용 공고 ID',
    `user_id` BIGINT NOT NULL COMMENT '대상 사용자 ID',
    `similarity_score` DECIMAL(5, 2) NOT NULL COMMENT '공고 유사도 점수 (예: 92.50, 최대 100.00)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '점수 갱신 시간',
    PRIMARY KEY (`similarity_id`),
    FOREIGN KEY (`posting_id`) REFERENCES `job_posting` (`posting_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
);

CREATE TABLE `notifications` (
    `notification_id` BIGINT AUTO_INCREMENT NOT NULL COMMENT '알림 고유 식별자',
    `user_id` BIGINT NOT NULL COMMENT '알림을 받을 사용자 ID',
    `category` VARCHAR(50) NOT NULL COMMENT '알림 대분류',
    `content` VARCHAR(255) NOT NULL COMMENT '알림 내용',
    `reference_id` BIGINT NULL COMMENT '관련 도메인 ID (프로젝트 ID, PR ID 등)',
    `reference_url` VARCHAR(255) NULL COMMENT '클릭 시 이동할 프론트엔드 라우팅 URL',
    `is_read` TINYINT NOT NULL DEFAULT 0 COMMENT '알림 읽음 여부 (0: 안읽음, 1: 읽음)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`notification_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
);

-- 프로젝트 종속 테이블 (포지션, 스킬, 깃허브 레포 등)

CREATE TABLE `project_positions` (
    `position_id` BIGINT AUTO_INCREMENT NOT NULL COMMENT '모집 포지션 식별자 ID',
    `project_id` BIGINT NOT NULL COMMENT '프로젝트 ID',
    `role` VARCHAR(50) NOT NULL COMMENT '직무명',
    `description` VARCHAR(255) NULL COMMENT '직무 설명',
    `target_count` INT NOT NULL DEFAULT 1 COMMENT '목표 모집 인원',
    `current_count` INT NOT NULL DEFAULT 0 COMMENT '현재 합류 인원',
    `status` VARCHAR(20) NOT NULL DEFAULT 'RECRUITING' COMMENT '모집 상태 (RECRUITING/DONE)',
    `require_skills` VARCHAR(255) NULL COMMENT '요구 기술 목록',
    `Requirement` VARCHAR(255) NULL COMMENT '지원 자격',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`position_id`),
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
);

CREATE TABLE `project_skills` (
    `project_skill_id` BIGINT AUTO_INCREMENT NOT NULL COMMENT '프로젝트 스킬 매핑 ID',
    `project_id` BIGINT NOT NULL,
    `skill_id` BIGINT NOT NULL COMMENT '스킬 ID',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`project_skill_id`),
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
    FOREIGN KEY (`skill_id`) REFERENCES `skill` (`skill_id`) ON DELETE CASCADE
);

CREATE TABLE `user_rep_projects` (
    `rep_id` BIGINT AUTO_INCREMENT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `project_id` BIGINT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`rep_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
);

CREATE TABLE `project_user_matches` (
    `match_id` BIGINT AUTO_INCREMENT NOT NULL COMMENT '매칭 고유 ID',
    `project_id` BIGINT NOT NULL COMMENT '대상 프로젝트 ID',
    `user_id` BIGINT NOT NULL COMMENT '대상 사용자 ID',
    `match_score` DECIMAL(5, 2) NOT NULL COMMENT '매칭 유사도 점수',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`match_id`),
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
);

CREATE TABLE `git_repositories` (
    `repo_id` BIGINT AUTO_INCREMENT NOT NULL,
    `project_id` BIGINT NOT NULL,
    `repo_url` VARCHAR(255) NOT NULL COMMENT '연동된 깃 URL',
    `webhook_secret` VARCHAR(100) NOT NULL COMMENT '웹훅 검증용 시크릿',
    PRIMARY KEY (`repo_id`),
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
);

-- 최하위 종속 테이블 (팀원, 합류요청, PR, 트러블슈팅 등)

CREATE TABLE `join_requests` (
    `request_id` BIGINT AUTO_INCREMENT NOT NULL COMMENT '합류 요청 고유 ID',
    `user_id` BIGINT NOT NULL COMMENT '사용자 고유 식별번호',
    `project_id` BIGINT NOT NULL,
    `position_id` BIGINT NOT NULL COMMENT '모집 포지션 식별자 ID',
    `request_type` VARCHAR(20) NOT NULL COMMENT '요청 방향 (APPLY, INVITE)',
    `appeal_content` TEXT NULL COMMENT '어필 내용 및 인사말',
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '처리 상태 (PENDING, ACCEPTED, REJECTED)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`request_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
    FOREIGN KEY (`position_id`) REFERENCES `project_positions` (`position_id`) ON DELETE CASCADE
);

CREATE TABLE `project_members` (
    `member_id` BIGINT AUTO_INCREMENT NOT NULL,
    `project_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `position_id` BIGINT NULL COMMENT '모집 포지션 식별자 ID',
    `status` VARCHAR(20) DEFAULT 'ATTEND' COMMENT 'ATTEND, LEAVE, REVOKE',
    `role` VARCHAR(255) NOT NULL COMMENT 'BE/FE/AI/PM/INFRA/DESIGN',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL,
    PRIMARY KEY (`member_id`),
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`position_id`) REFERENCES `project_positions` (`position_id`) ON DELETE SET NULL
);

CREATE TABLE `pull_requests` (
    `pr_id` BIGINT AUTO_INCREMENT NOT NULL,
    `repo_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL COMMENT 'PR 작성자',
    `project_id` BIGINT NOT NULL COMMENT '조회 성능을 위한 역정규화',
    `pr_number` INT NULL COMMENT '깃허브 PR 번호',
    `title` VARCHAR(200) NULL COMMENT 'PR 제목',
    `diff_url` VARCHAR(255) NULL COMMENT '코드 변경 내역 링크',
    `diff_content` MEDIUMTEXT NULL COMMENT '변경된 코드 Diff 텍스트 원본',
    `diff_summary` TEXT NULL COMMENT '변경된 핵심 코드 요약',
    `branch_name` VARCHAR(100) NOT NULL COMMENT '브랜치명',
    `status` VARCHAR(10) NULL COMMENT 'open/closed/merged',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`pr_id`),
    FOREIGN KEY (`repo_id`) REFERENCES `git_repositories` (`repo_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
);

CREATE TABLE `pr_reviews` (
    `review_id` BIGINT AUTO_INCREMENT NOT NULL,
    `pr_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL COMMENT '리뷰 작성자',
    `comment` TEXT NULL COMMENT '리뷰 내용',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`review_id`),
    FOREIGN KEY (`pr_id`) REFERENCES `pull_requests` (`pr_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
);

CREATE TABLE `troubleshootings` (
    `ts_id` BIGINT AUTO_INCREMENT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `project_id` BIGINT NOT NULL COMMENT '프로젝트 ID',
    `pr_id` BIGINT NOT NULL,
    `title` VARCHAR(200) NOT NULL COMMENT '트러블슈팅 주제',
    `role` VARCHAR(20) NULL COMMENT '해결 당시 직무',
    `language` VARCHAR(50) NULL COMMENT '주력 사용 언어',
    `framework` VARCHAR(100) NULL COMMENT '사용 프레임워크 및 도구',
    `situation` TEXT NULL COMMENT '문제상황(마크다운)',
    `solution` TEXT NULL COMMENT '해결 방법(마크다운)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`ts_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
    FOREIGN KEY (`pr_id`) REFERENCES `pull_requests` (`pr_id`) ON DELETE CASCADE
);

ALTER TABLE pull_requests ADD COLUMN github_created_at DATETIME;

ALTER TABLE pull_requests
ADD COLUMN github_closed_at DATETIME NULL COMMENT '깃허브에서 PR이 닫힌(또는 병합된) 실제 시간';

-- 1. 기존 users 테이블에서 좁아터진 role 컬럼 날려버리기!
ALTER TABLE `users` DROP COLUMN `role`;

-- 2. 유저 1명이 여러 직무를 가질 수 있도록 1:N 매핑 테이블 신규 생성!
CREATE TABLE `user_roles` (
    `user_role_id` BIGINT AUTO_INCREMENT NOT NULL COMMENT '유저-직무 매핑 고유 ID',
    `user_id` BIGINT NOT NULL COMMENT '사용자 고유 식별번호',
    `role` VARCHAR(20) NOT NULL COMMENT '선호 개발 포지션 (BE, FE, AI, PM 등)',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_role_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
);