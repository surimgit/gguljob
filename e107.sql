-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: gguljob_dev
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */
;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */
;
/*!50503 SET NAMES utf8 */
;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */
;
/*!40103 SET TIME_ZONE='+00:00' */
;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */
;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */
;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */
;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */
;

--
-- Table structure for table `chat_logs`
--

DROP TABLE IF EXISTS `chat_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `chat_logs` (
    `log_id` bigint NOT NULL AUTO_INCREMENT COMMENT '채팅 로그 고유 ID',
    `user_id` bigint NOT NULL COMMENT '사용자 ID',
    `project_id` bigint NOT NULL COMMENT '프로젝트 ID',
    `pr_id` bigint DEFAULT NULL COMMENT '관련 PR ID (미리 엮어둠)',
    `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '질문 및 답변 텍스트',
    `is_processed` tinyint(1) NOT NULL DEFAULT '0' COMMENT '트러블슈팅 변환 완료 플래그 (0: 미처리, 1: 처리완료)',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    PRIMARY KEY (`log_id`),
    KEY `fk_chat_logs_user` (`user_id`),
    KEY `fk_chat_logs_project` (`project_id`),
    KEY `fk_chat_logs_pr` (`pr_id`),
    CONSTRAINT `fk_chat_logs_pr` FOREIGN KEY (`pr_id`) REFERENCES `pull_requests` (`pr_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_chat_logs_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_chat_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 103 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `git_repositories`
--

DROP TABLE IF EXISTS `git_repositories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `git_repositories` (
    `repo_id` bigint NOT NULL AUTO_INCREMENT,
    `project_id` bigint NOT NULL,
    `repo_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '연동된 깃 URL',
    `webhook_secret` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '웹훅 검증용 시크릿',
    PRIMARY KEY (`repo_id`),
    KEY `project_id` (`project_id`),
    CONSTRAINT `git_repositories_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 10003 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `job_bookmark`
--

DROP TABLE IF EXISTS `job_bookmark`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `job_bookmark` (
    `bookmark_id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` bigint NOT NULL,
    `posting_id` bigint NOT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`bookmark_id`),
    KEY `user_id` (`user_id`),
    KEY `posting_id` (`posting_id`),
    CONSTRAINT `job_bookmark_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `job_bookmark_ibfk_2` FOREIGN KEY (`posting_id`) REFERENCES `job_posting` (`posting_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 22 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `job_posting`
--

DROP TABLE IF EXISTS `job_posting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `job_posting` (
    `posting_id` bigint NOT NULL AUTO_INCREMENT,
    `company_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '공고 기업',
    `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '공고 제목',
    `hyperlink` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '하이퍼링크 주소',
    `position_details` text COLLATE utf8mb4_unicode_ci COMMENT '포지션 상세',
    `main_tasks` text COLLATE utf8mb4_unicode_ci COMMENT '주요 업무',
    `requirements` text COLLATE utf8mb4_unicode_ci COMMENT '자격요건',
    `preferred_points` text COLLATE utf8mb4_unicode_ci COMMENT '우대사항',
    `deadline` datetime DEFAULT NULL COMMENT '마감일(상시채용은 NULL)',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `origin_job_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '잡코리아 고유 공고 ID',
    `job_category` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '직무 카테고리 (백엔드, 프론트엔드 등)',
    `tech_stacks` text COLLATE utf8mb4_unicode_ci COMMENT '정규화된 기술스택(JSON 문자열)',
    `experience_level` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '경력',
    `salary` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '급여',
    `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '근무지역',
    `contract_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '고용형태',
    `logo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    PRIMARY KEY (`posting_id`),
    UNIQUE KEY `uq_job_posting_origin_job_id` (`origin_job_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 18856 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `job_posting_skill`
--

DROP TABLE IF EXISTS `job_posting_skill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `job_posting_skill` (
    `job_posting_skill_id` bigint NOT NULL AUTO_INCREMENT COMMENT '공고 스킬 매핑 ID',
    `posting_id` bigint NOT NULL COMMENT '채용공고 ID',
    `skill_id` bigint NOT NULL COMMENT '스킬 ID',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`job_posting_skill_id`),
    UNIQUE KEY `uq_job_posting_skill_posting_skill` (`posting_id`, `skill_id`),
    KEY `fk_job_posting_skill_skill` (`skill_id`),
    CONSTRAINT `fk_job_posting_skill_posting` FOREIGN KEY (`posting_id`) REFERENCES `job_posting` (`posting_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_job_posting_skill_skill` FOREIGN KEY (`skill_id`) REFERENCES `skill` (`skill_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 32768 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `job_user_similarities`
--

DROP TABLE IF EXISTS `job_user_similarities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `job_user_similarities` (
    `similarity_id` bigint NOT NULL AUTO_INCREMENT COMMENT '공고 유사도 고유 ID',
    `posting_id` bigint NOT NULL COMMENT '대상 채용 공고 ID',
    `user_id` bigint NOT NULL COMMENT '대상 사용자 ID',
    `similarity_score` decimal(5, 2) NOT NULL COMMENT '공고 유사도 점수 (예: 92.50, 최대 100.00)',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '점수 갱신 시간',
    PRIMARY KEY (`similarity_id`),
    KEY `posting_id` (`posting_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `job_user_similarities_ibfk_1` FOREIGN KEY (`posting_id`) REFERENCES `job_posting` (`posting_id`) ON DELETE CASCADE,
    CONSTRAINT `job_user_similarities_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `join_requests`
--

DROP TABLE IF EXISTS `join_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `join_requests` (
    `request_id` bigint NOT NULL AUTO_INCREMENT COMMENT '합류 요청 고유 ID',
    `user_id` bigint NOT NULL COMMENT '사용자 고유 식별번호',
    `project_id` bigint NOT NULL,
    `position_id` bigint DEFAULT NULL,
    `role` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '팀 내 역할',
    `request_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '요청 방향 (APPLY, INVITE)',
    `appeal_content` text COLLATE utf8mb4_unicode_ci COMMENT '어필 내용 및 인사말',
    `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING' COMMENT '처리 상태 (PENDING, ACCEPTED, REJECTED)',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`request_id`),
    KEY `user_id` (`user_id`),
    KEY `project_id` (`project_id`),
    KEY `position_id` (`position_id`),
    CONSTRAINT `join_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `join_requests_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
    CONSTRAINT `join_requests_ibfk_3` FOREIGN KEY (`position_id`) REFERENCES `project_positions` (`position_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 8 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `notifications` (
    `notification_id` bigint NOT NULL AUTO_INCREMENT COMMENT '알림 고유 식별자',
    `user_id` bigint NOT NULL COMMENT '알림을 받을 사용자 ID',
    `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '알림 대분류',
    `content` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '알림 내용',
    `reference_id` bigint DEFAULT NULL COMMENT '관련 도메인 ID (프로젝트 ID, PR ID 등)',
    `reference_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '클릭 시 이동할 프론트엔드 라우팅 URL',
    `is_read` tinyint NOT NULL DEFAULT '0' COMMENT '알림 읽음 여부 (0: 안읽음, 1: 읽음)',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`notification_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 27 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `oauth_providers`
--

DROP TABLE IF EXISTS `oauth_providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `oauth_providers` (
    `oauth_id` bigint NOT NULL AUTO_INCREMENT COMMENT '소셜 인증 고유 ID',
    `user_id` bigint NOT NULL,
    `provider` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'KAKAO, GOOGLE, GITHUB',
    `provider_account_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '소셜 서버 고유 식별자',
    `access_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'GitHub Repo 접근용 토큰',
    PRIMARY KEY (`oauth_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `oauth_providers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `portfolios`
--

DROP TABLE IF EXISTS `portfolios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `portfolios` (
    `portfolio_id` bigint NOT NULL AUTO_INCREMENT COMMENT '포트폴리오 고유 ID',
    `user_id` bigint NOT NULL COMMENT '사용자 고유 식별번호',
    `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '포트폴리오 제목',
    `s3_url` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '포트폴리오 S3 파일 URL',
    `is_public` tinyint(1) NOT NULL DEFAULT '1' COMMENT '공개 여부 (TRUE: 공개, FALSE: 비공개)',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '생성 날짜',
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 날짜',
    PRIMARY KEY (`portfolio_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `portfolios_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `pr_reviews`
--

DROP TABLE IF EXISTS `pr_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `pr_reviews` (
    `review_id` bigint NOT NULL AUTO_INCREMENT,
    `pr_id` bigint NOT NULL,
    `user_id` bigint NOT NULL COMMENT '리뷰 작성자',
    `comment` text COLLATE utf8mb4_unicode_ci COMMENT '리뷰 내용',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`review_id`),
    KEY `pr_id` (`pr_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `pr_reviews_ibfk_1` FOREIGN KEY (`pr_id`) REFERENCES `pull_requests` (`pr_id`) ON DELETE CASCADE,
    CONSTRAINT `pr_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `project_members`
--

DROP TABLE IF EXISTS `project_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `project_members` (
    `member_id` bigint NOT NULL AUTO_INCREMENT,
    `project_id` bigint NOT NULL,
    `user_id` bigint NOT NULL,
    `position_id` bigint DEFAULT NULL COMMENT '모집 포지션 식별자 ID',
    `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'ATTEND' COMMENT 'ATTEND, LEAVE, REVOKE',
    `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'BE/FE/AI/PM/INFRA/DESIGN',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `deleted_at` datetime DEFAULT NULL,
    PRIMARY KEY (`member_id`),
    KEY `project_id` (`project_id`),
    KEY `user_id` (`user_id`),
    KEY `position_id` (`position_id`),
    CONSTRAINT `project_members_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
    CONSTRAINT `project_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `project_members_ibfk_3` FOREIGN KEY (`position_id`) REFERENCES `project_positions` (`position_id`) ON DELETE SET NULL
) ENGINE = InnoDB AUTO_INCREMENT = 22 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `project_positions`
--

DROP TABLE IF EXISTS `project_positions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `project_positions` (
    `position_id` bigint NOT NULL AUTO_INCREMENT COMMENT '모집 포지션 식별자 ID',
    `project_id` bigint NOT NULL COMMENT '프로젝트 ID',
    `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '직무명',
    `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '직무 설명',
    `target_count` int NOT NULL DEFAULT '1' COMMENT '목표 모집 인원',
    `current_count` int NOT NULL DEFAULT '0' COMMENT '현재 합류 인원',
    `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RECRUITING' COMMENT '모집 상태 (RECRUITING/DONE)',
    `require_skills` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '요구 기술 목록',
    `Requirement` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '지원 자격',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`position_id`),
    KEY `project_id` (`project_id`),
    CONSTRAINT `project_positions_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 22 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `project_skills`
--

DROP TABLE IF EXISTS `project_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `project_skills` (
    `project_skill_id` bigint NOT NULL AUTO_INCREMENT COMMENT '프로젝트 스킬 매핑 ID',
    `project_id` bigint NOT NULL,
    `skill_id` bigint NOT NULL COMMENT '스킬 ID',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`project_skill_id`),
    KEY `project_id` (`project_id`),
    KEY `skill_id` (`skill_id`),
    CONSTRAINT `project_skills_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
    CONSTRAINT `project_skills_ibfk_2` FOREIGN KEY (`skill_id`) REFERENCES `skill` (`skill_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 16 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `project_user_matches`
--

DROP TABLE IF EXISTS `project_user_matches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `project_user_matches` (
    `match_id` bigint NOT NULL AUTO_INCREMENT COMMENT '매칭 고유 ID',
    `project_id` bigint NOT NULL COMMENT '대상 프로젝트 ID',
    `user_id` bigint NOT NULL COMMENT '대상 사용자 ID',
    `match_score` decimal(5, 2) NOT NULL COMMENT '매칭 유사도 점수',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`match_id`),
    KEY `project_id` (`project_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `project_user_matches_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
    CONSTRAINT `project_user_matches_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `projects` (
    `project_id` bigint NOT NULL AUTO_INCREMENT,
    `leader_id` bigint NOT NULL COMMENT '팀장 ID',
    `team_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '팀 이름',
    `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '프로젝트 명',
    `domain` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '프로젝트 도메인',
    `description` text COLLATE utf8mb4_unicode_ci COMMENT '상세 주제',
    `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'RECRUITING' COMMENT 'RECRUITING, PROCEEDING, DONE',
    `is_public` tinyint(1) NOT NULL DEFAULT '0' COMMENT '프로젝트 공개/비공개',
    `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '프로젝트 대표 이미지 url',
    `readme` text COLLATE utf8mb4_unicode_ci COMMENT 'README 마크다운 텍스트',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `finished_at` datetime DEFAULT NULL COMMENT '프로젝트 종료 시간 (DONE)',
    PRIMARY KEY (`project_id`),
    KEY `leader_id` (`leader_id`),
    CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`leader_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 10008 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `pull_requests`
--

DROP TABLE IF EXISTS `pull_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `pull_requests` (
    `pr_id` bigint NOT NULL AUTO_INCREMENT,
    `repo_id` bigint NOT NULL,
    `user_id` bigint NOT NULL COMMENT 'PR 작성자',
    `project_id` bigint NOT NULL COMMENT '조회 성능을 위한 역정규화',
    `pr_number` int DEFAULT NULL COMMENT '깃허브 PR 번호',
    `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PR 제목',
    `diff_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '코드 변경 내역 링크',
    `diff_content` mediumtext COLLATE utf8mb4_unicode_ci COMMENT '변경된 코드 Diff 텍스트 원본',
    `diff_summary` text COLLATE utf8mb4_unicode_ci COMMENT '변경된 핵심 코드 요약',
    `branch_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '브랜치명',
    `status` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'open/closed/merged',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `github_created_at` datetime DEFAULT NULL,
    `github_closed_at` datetime DEFAULT NULL COMMENT '깃허브에서 PR이 닫힌(또는 병합된) 실제 시간',
    PRIMARY KEY (`pr_id`),
    KEY `repo_id` (`repo_id`),
    KEY `user_id` (`user_id`),
    KEY `project_id` (`project_id`),
    CONSTRAINT `pull_requests_ibfk_1` FOREIGN KEY (`repo_id`) REFERENCES `git_repositories` (`repo_id`) ON DELETE CASCADE,
    CONSTRAINT `pull_requests_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `pull_requests_ibfk_3` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 10000 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `skill`
--

DROP TABLE IF EXISTS `skill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `skill` (
    `skill_id` bigint NOT NULL AUTO_INCREMENT COMMENT '스킬 ID',
    `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '스킬명 (예: Java, Spring Boot)',
    `synonyms` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '유의어 (Neo4j 및 검색용)',
    `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '분류 (BACKEND, FRONTEND 등)',
    `icon_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '프론트엔드 렌더링용 로고 URL',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`skill_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 73 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `troubleshootings`
--

DROP TABLE IF EXISTS `troubleshootings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `troubleshootings` (
    `ts_id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` bigint NOT NULL,
    `project_id` bigint NOT NULL COMMENT '프로젝트 ID',
    `pr_id` bigint NOT NULL,
    `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '트러블슈팅 주제',
    `role` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '해결 당시 직무',
    `language` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '주력 사용 언어',
    `framework` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '사용 프레임워크 및 도구',
    `situation` text COLLATE utf8mb4_unicode_ci COMMENT '문제상황(마크다운)',
    `solution` text COLLATE utf8mb4_unicode_ci COMMENT '해결 방법(마크다운)',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `code_snippet` text COLLATE utf8mb4_unicode_ci COMMENT '핵심 변경 코드 스니펫',
    `confidence` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'AI 분석 신뢰도 (high/medium/low)',
    PRIMARY KEY (`ts_id`),
    KEY `user_id` (`user_id`),
    KEY `project_id` (`project_id`),
    KEY `pr_id` (`pr_id`),
    CONSTRAINT `troubleshootings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `troubleshootings_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE,
    CONSTRAINT `troubleshootings_ibfk_3` FOREIGN KEY (`pr_id`) REFERENCES `pull_requests` (`pr_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 18 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `user_goals`
--

DROP TABLE IF EXISTS `user_goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `user_goals` (
    `user_goal_id` bigint NOT NULL AUTO_INCREMENT COMMENT '유저-목표 매핑 고유 ID',
    `user_id` bigint NOT NULL COMMENT '사용자 고유 식별번호',
    `goal` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '사용자 목표 (예: 사이드 프로젝트, 취업 준비 등)',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_goal_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `user_goals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 72 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `user_rep_projects`
--

DROP TABLE IF EXISTS `user_rep_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `user_rep_projects` (
    `rep_id` bigint NOT NULL AUTO_INCREMENT,
    `user_id` bigint NOT NULL,
    `project_id` bigint NOT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`rep_id`),
    KEY `user_id` (`user_id`),
    KEY `project_id` (`project_id`),
    CONSTRAINT `user_rep_projects_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `user_rep_projects_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `projects` (`project_id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `user_roles` (
    `user_role_id` bigint NOT NULL AUTO_INCREMENT COMMENT '유저-직무 매핑 고유 ID',
    `user_id` bigint NOT NULL COMMENT '사용자 고유 식별번호',
    `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '선호 개발 포지션 (BE, FE, AI, PM 등)',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_role_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 86 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `user_skill`
--

DROP TABLE IF EXISTS `user_skill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `user_skill` (
    `user_skill_id` bigint NOT NULL AUTO_INCREMENT COMMENT '사용자 스킬 ID',
    `user_id` bigint NOT NULL COMMENT '사용자 고유 식별번호',
    `skill_id` bigint NOT NULL COMMENT '스킬 ID',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_skill_id`),
    KEY `user_id` (`user_id`),
    KEY `skill_id` (`skill_id`),
    CONSTRAINT `user_skill_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `user_skill_ibfk_2` FOREIGN KEY (`skill_id`) REFERENCES `skill` (`skill_id`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 575 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `users` (
    `user_id` bigint NOT NULL AUTO_INCREMENT COMMENT '사용자 고유 식별번호',
    `user_name` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '사용자명',
    `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '이메일(계정 식별용)',
    `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '프로필 한줄 소개',
    `mbti` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '사용자 MBTI 성향',
    `experience` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '개발 경험 (입문/초급/중급/고급)',
    `team_tendency` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '팀 내 성향 (팔로워/리더)',
    `profile_image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '프로필 이미지 URL',
    `authority` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ROLE_USER' COMMENT '시스템 접근 권한',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '계정 생성 시간',
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '계정 수정 시간',
    PRIMARY KEY (`user_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 10000 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */
;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */
;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */
;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */
;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */
;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */
;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */
;

-- Dump completed on 2026-03-23 10:31:07