-- 1. 최상위 부모 테이블 (의존성 없음)
CREATE TABLE `users` (
    `user_id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '사용자 고유 식별번호',
    `user_name` VARCHAR(20) NULL COMMENT '사용자명',
    `email` VARCHAR(100) NOT NULL COMMENT '이메일(계정 식별용)',
    `mbti` VARCHAR(4) NULL COMMENT '사용자 MBTI 성향',
    `position` VARCHAR(20) NULL COMMENT '선호 개발 포지션(BACKEND, FRONTEND)',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP COMMENT '계정 생성 시간',
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '계정 수정 시간'
);

CREATE TABLE `skills` (
    `skill_id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '스킬 ID',
    `name` VARCHAR(50) NOT NULL COMMENT '스킬명 (예: Java, Spring Boot)',
    `synonyms` VARCHAR(255) NULL COMMENT '유의어 (Neo4j 및 검색용)',
    `category` VARCHAR(50) NULL COMMENT '분류 (BACKEND, FRONTEND 등)',
    `icon_url` VARCHAR(255) NULL COMMENT '프론트엔드 렌더링용 로고 URL',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `job_postings` (
    `posting_id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '공고 식별자',
    `company_name` VARCHAR(100) NOT NULL COMMENT '공고 기업',
    `title` VARCHAR(200) NOT NULL COMMENT '공고 제목',
    `tech_stacks` VARCHAR(255) NOT NULL COMMENT '요구 스택',
    `vector_embedding` BLOB NULL COMMENT '유사도 분석용 벡터',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. 사용자 종속 테이블
CREATE TABLE `user_skills` (
    `user_skill_id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '사용자 스킬 ID',
    `user_id` BIGINT NOT NULL COMMENT '사용자 고유 식별번호',
    `skill_id` BIGINT NOT NULL COMMENT '스킬 ID',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`) ON DELETE CASCADE
);

CREATE TABLE `oauth_providers` (
    `oauth_id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '소셜 인증 고유 ID',
    `user_id` BIGINT NOT NULL,
    `provider` VARCHAR(20) NOT NULL COMMENT 'KAKAO, GOOGLE, GITHUB',
    `provider_account_id` VARCHAR(100) NOT NULL COMMENT '소셜 서버 고유 식별자',
    `access_token` VARCHAR(255) NULL COMMENT 'GitHub Repo 접근용 토큰',
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
);

CREATE TABLE `job_bookmarks` (
    `bookmark_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `posting_id` BIGINT NOT NULL,
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`posting_id`) REFERENCES `job_postings` (`posting_id`) ON DELETE CASCADE
);

-- 3. 프로젝트 메인 테이블
CREATE TABLE `projects` (
    `project_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `leader_id` BIGINT NOT NULL COMMENT '팀장 ID',
    `team_name` VARCHAR(50) NULL COMMENT '팀 이름',
    `title` VARCHAR(100) NOT NULL COMMENT '프로젝트 명',
    `domain` VARCHAR(50) NULL COMMENT '프로젝트 도메인',
    `description` TEXT NULL COMMENT '상세 주제',
    `status` VARCHAR(20) NULL DEFAULT 'RECRUITING' COMMENT 'RECRUITING, PROCEEDING, DONE',
    `is_public` BOOLEAN NOT NULL DEFAULT FALSE COMMENT '프로젝트 공개/비공개',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `finished_at` DATETIME NULL COMMENT '프로젝트 종료 시간 (DONE)',
    FOREIGN KEY (`leader_id`) REFERENCES `users` (`user_id`)
);

-- 4. 프로젝트 종속 테이블 (모집 포지션, 멤버, 깃허브)
CREATE TABLE `project_positions` (
    `position_id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '모집 포지션 식별자 ID',
    `project_id` BIGINT NOT NULL COMMENT '프로젝트 ID',
    `role` VARCHAR(50) NOT NULL COMMENT '직무명',
    `description` VARCHAR(255) NULL COMMENT '직무 설명',
    `target_count` INT NOT NULL DEFAULT 1 COMMENT '목표 모집 인원',
    `current_count` INT NOT NULL DEFAULT 0 COMMENT '현재 합류 인원',
    `status` VARCHAR(20) NOT NULL DEFAULT 'RECRUITING' COMMENT '모집 상태',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
);

CREATE TABLE `project_members` (
    `member_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `project_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `position_id` BIGINT NOT NULL COMMENT '모집 포지션 식별자 ID',
    `status` VARCHAR(20) NULL DEFAULT 'APPLIED' COMMENT 'APPLIED, INVITED, ACCEPTED',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`position_id`) REFERENCES `project_positions` (`position_id`) ON DELETE CASCADE
);

CREATE TABLE `git_repositories` (
    `repo_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `project_id` BIGINT NOT NULL,
    `repo_url` VARCHAR(255) NOT NULL COMMENT '연동된 깃 URL',
    `webhook_secret` VARCHAR(100) NOT NULL COMMENT '웹훅 검증용 시크릿',
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
);

-- 5. 깃허브 PR 및 리뷰, 트러블슈팅
CREATE TABLE `pull_requests` (
    `pr_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `repo_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL COMMENT 'PR 작성자',
    `project_id` BIGINT NOT NULL COMMENT '조회 성능을 위한 역정규화',
    `pr_number` INT NULL COMMENT '깃허브 PR 번호',
    `title` VARCHAR(200) NULL COMMENT 'PR 제목',
    `diff_url` VARCHAR(255) NULL COMMENT '코드 변경 내역 링크',
    `diff_content` MEDIUMTEXT NULL COMMENT '변경된 코드 Diff 텍스트 원본',
    `diff_summary` TEXT NULL COMMENT '변경된 핵심 코드 요약',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`repo_id`) REFERENCES `git_repositories` (`repo_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`)
);

CREATE TABLE `pr_reviews` (
    `review_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `pr_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL COMMENT '리뷰 작성자',
    `comment` TEXT NULL COMMENT '리뷰 내용',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`pr_id`) REFERENCES `pull_requests` (`pr_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
);

CREATE TABLE `troubleshootings` (
    `ts_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `pr_id` BIGINT NOT NULL,
    `title` VARCHAR(200) NOT NULL COMMENT '트러블슈팅 주제',
    `role` VARCHAR(20) NULL COMMENT '해결 당시 직무',
    `language` VARCHAR(50) NULL COMMENT '주력 사용 언어',
    `framework` VARCHAR(100) NULL COMMENT '사용 프레임워크 및 도구',
    `content` TEXT NOT NULL COMMENT '마크다운 변환 결과',
    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
    FOREIGN KEY (`pr_id`) REFERENCES `pull_requests` (`pr_id`) ON DELETE CASCADE
);