package com.ssafy.gguljob.backend.domain.github.service;

import com.ssafy.gguljob.backend.domain.github.entity.GitRepository;
import com.ssafy.gguljob.backend.domain.github.entity.PrReview;
import com.ssafy.gguljob.backend.domain.github.entity.PullRequest;
import com.ssafy.gguljob.backend.domain.github.repository.GitRepositoryRepository;
import com.ssafy.gguljob.backend.domain.github.repository.PrReviewRepository;
import com.ssafy.gguljob.backend.domain.github.repository.PullRequestRepository;
import com.ssafy.gguljob.backend.domain.github.type.PrStatus;
import com.ssafy.gguljob.backend.domain.project.dto.InitialPrSyncEvent;
import com.ssafy.gguljob.backend.domain.project.entity.Project;
import com.ssafy.gguljob.backend.domain.project.repository.ProjectRepository;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class GithubSyncService {

    private final PullRequestRepository pullRequestRepository;
    private final PrReviewRepository prReviewRepository;
    private final ProjectRepository projectRepository;
    private final GitRepositoryRepository gitRepositoryRepository;
    private final UserRepository userRepository;

    private final RestClient restClient = RestClient.create("https://api.github.com");

    public void syncInitialPullRequests(InitialPrSyncEvent event){

        // owner/repo 추출
        String[] urlParts = event.repoUrl().replace("https://github.com/", "").split("/");
        if (urlParts.length < 2) throw new IllegalArgumentException("잘못된 깃허브 URL 형식입니다.");
        String owner = urlParts[0];
        String repo = urlParts[1];

        // 페이징으로 PR 데이터 긁기 (DB 커넥션 X 외부 네트워크 통신만 수행)
        List<Map<String, Object>> allPrs = fetchAllPullRequests(owner, repo, event.githubToken());

        if (!allPrs.isEmpty()) {
            savePullRequests(event.projectId(), event.repoId(), allPrs);
        }
    }

    /**
     * 특정 PR에 달린 모든 Issue Comments(Reviews)를 수집하여 DB에 저장
     */
    @Transactional
    public void syncPrReviews(String owner, String repo, String token,
        Long repoId, Integer prNumber) {

        PullRequest pullRequest = pullRequestRepository
            .findByGitRepository_IdAndPrNumber(repoId, prNumber)
            .orElseThrow(() -> new IllegalArgumentException(
                "리뷰를 저장할 PR을 찾을 수 없습니다. (PR: " + prNumber + ")"));

        // issue_comment API로 교체
        // GET /repos/{owner}/{repo}/issues/{prNumber}/comments
        List<Map<String, Object>> comments =
            fetchAllIssueComments(owner, repo, token, prNumber);

        Set<String> targetNicknames = comments.stream()
            .map(c -> extractLogin(c, "user"))
            .collect(Collectors.toSet());

        Map<String, User> userMapByNickname = userRepository.findByGithubNicknameIn(targetNicknames)
            .stream().collect(Collectors.toMap(User::getGithubNickname, u -> u));

        List<PrReview> reviewEntities = new ArrayList<>();

        for (Map<String, Object> comment : comments) {
            User commenter = userMapByNickname.get(extractLogin(comment, "user"));
            if (commenter == null) {
                log.warn("DB에 없는 댓글 작성자. Skip (login: {})", extractLogin(comment, "user"));
                continue;
            }
            reviewEntities.add(PrReview.builder()
                .pullRequest(pullRequest)
                .user(commenter)
                .comment((String) comment.get("body"))
                .build());
        }

        if (!reviewEntities.isEmpty()) {
            prReviewRepository.saveAll(reviewEntities);
            log.info("✅ PR #{} 댓글 {}건 저장 완료", prNumber, reviewEntities.size());
        } else {
            log.info("PR #{} 에 저장할 댓글이 없습니다.", prNumber);
        }
    }

    private List<Map<String, Object>> fetchAllIssueComments(String owner, String repo,
        String token, Integer prNumber) {
        List<Map<String, Object>> all = new ArrayList<>();
        int page = 1;
        final int PER_PAGE = 100;

        while (true) {
            List<Map<String, Object>> pageData = restClient.get()
                .uri("/repos/{owner}/{repo}/issues/{prNumber}/comments?per_page={perPage}&page={page}",
                    owner, repo, prNumber, PER_PAGE, page)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {});

            if (pageData == null || pageData.isEmpty()) break;
            all.addAll(pageData);
            page++;
        }
        log.info("PR #{} 댓글 {}건 수집 완료", prNumber, all.size());
        return all;
    }

    @SuppressWarnings("unchecked")
    private String extractLogin(Map<String, Object> map, String userKey) {
        Map<String, Object> userMap = (Map<String, Object>) map.get(userKey);
        return userMap != null ? (String) userMap.get("login") : "unknown";
    }

    private List<Map<String, Object>> fetchAllPullRequests(String owner, String repo, String token) {
        List<Map<String, Object>> allPrs = new ArrayList<>();
        int page = 1;
        final int PER_PAGE = 100;

        while (true) {
            List<Map<String, Object>> prs = restClient.get()
                .uri("/repos/{owner}/{repo}/pulls?state=all&per_page={perPage}&page={page}", owner, repo, PER_PAGE, page)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(new ParameterizedTypeReference<List<Map<String, Object>>>() {});

            if (prs == null || prs.isEmpty()) {
                break;
            }
            allPrs.addAll(prs);
            page++;
        }
        log.info("총 {}개의 PR 데이터를 불러왔습니다.", allPrs.size());
        return allPrs;
    }

    @Transactional
    public void savePullRequests(Long projectId, Long repoId, List<Map<String, Object>> prList) {
        Project projectRef = projectRepository.getReferenceById(projectId);
        GitRepository repoRef = gitRepositoryRepository.getReferenceById(repoId);

        // 확인용 PR 넘버셋
        List<PullRequest> existingPrs = pullRequestRepository.findByGitRepository_Id(repoId);
        Set<Integer> existingPrSet = existingPrs.stream()
            .map(PullRequest::getPrNumber)
            .collect(Collectors.toSet());

        // 닉네임 <-> MR 유저 매칭을 위한 Map 만들기
        Set<String> targetNicknames = prList.stream()
            .map(pr -> extractLogin(pr, "user"))
            .collect(Collectors.toSet());

        List<User> users = userRepository.findByGithubNicknameIn(targetNicknames);

        // Key: 깃허브 닉네임, Value: 유저 객체
        Map<String, User> userMapByNickname = users.stream()
            .collect(Collectors.toMap(User::getGithubNickname, user -> user));

        List<PullRequest> pullRequestEntities = new ArrayList<>();

        for (Map<String, Object> pr : prList) {

            Integer prNumber = (Integer) pr.get("number");

            // PR 중복 검증
            if (existingPrSet.contains(prNumber)) {
                log.debug("이미 저장된 PR입니다. Skip - PR Number: {}", prNumber);
                continue;
            }

            // 작성자 닉네임 매칭
            String githubUsername = extractLogin(pr, "user");

            User author = userMapByNickname.get(githubUsername);

            if (author == null) {
                log.warn("DB에 없는 유저의 PR입니다. Skip (github username: {})", githubUsername);
                continue;
            }

            // MR 상태 및 생성 시간
            Map<String, Object> head = (Map<String, Object>) pr.get("head");
            String stateStr = (String) pr.get("state");
            PrStatus prStatus = PrStatus.valueOf(stateStr.toUpperCase());

            String createdAtStr = (String) pr.get("created_at");
            LocalDateTime githubCreatedAt = ZonedDateTime.parse(createdAtStr).toLocalDateTime();
            String prBody = (String) pr.get("body");

            // 엔티티 생성
            PullRequest entity = PullRequest.builder()
                .project(projectRef)
                .gitRepository(repoRef)
                .prNumber(prNumber)
                .title((String) pr.get("title"))
                .diffUrl((String) pr.get("html_url"))
                .diffSummary(prBody)
                .branchName(head != null ? (String) head.get("ref") : "unknown")
                .status(prStatus)
                .githubCreatedAt(githubCreatedAt)
                .user(author)
                .build();

            pullRequestEntities.add(entity);
        }

        if (!pullRequestEntities.isEmpty()) {
            pullRequestRepository.saveAll(pullRequestEntities);
            log.info("성공적으로 필터링 및 매칭된 {}개의 새 PR을 DB에 저장했습니다.", pullRequestEntities.size());
        } else {
            log.info("새로 저장할 PR이 없습니다. (모두 중복이거나 미가입자의 PR)");
        }
    }
    public String fetchDiffFromGithub(String diffUrl) {
        if (diffUrl == null || diffUrl.isBlank()) return null;

        String cleanUrl = diffUrl.replaceAll("\\[|\\]|\\(.*?\\)", "").trim();
        String apiUrl = cleanUrl;
        if (cleanUrl.contains("github.com") && !cleanUrl.contains("api.github.com")) {
            apiUrl = cleanUrl.replace("https://github.com/", "https://api.github.com/repos/")
                .replace("/pull/", "/pulls/");
        }

        log.info("🎯 최종 확정 API 주소: [{}]", apiUrl);

        try {
            return restClient.get()
                .uri(apiUrl)
                .header("Accept", "application/vnd.github.v3.diff") // Diff 형식 요청
                .retrieve()
                .body(String.class);
        } catch (Exception e) {
            log.error("❌ Github API 호출 실패 (주소 문제 가능성): {} | 주소: {}", e.getMessage(), apiUrl);
            return null;
        }
    }

    /**
     * GitHub 토큰과 레포 접근 권한을 검증합니다.
     * @throws IllegalArgumentException 토큰이 유효하지 않거나 레포에 접근할 수 없는 경우
     */
    public void validateGitHubAccess(String owner, String repo, String token) {
        try {
            restClient.get()
                .uri("/repos/{owner}/{repo}", owner, repo)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .toBodilessEntity();
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            if (msg.contains("401") || msg.contains("unauthorized")) {
                throw new IllegalArgumentException("GitHub 토큰이 유효하지 않습니다. 토큰을 확인해 주세요.");
            }
            if (msg.contains("404") || msg.contains("not found")) {
                throw new IllegalArgumentException("레포지토리를 찾을 수 없습니다. URL과 접근 권한을 확인해 주세요.");
            }
            throw new IllegalArgumentException("GitHub 연동에 실패했습니다: " + e.getMessage());
        }
    }

    public String fetchReadmeFromGithub(String owner, String repo, String token) {
        String apiUrl = String.format("https://api.github.com/repos/%s/%s/readme", owner, repo);

        log.info("🚀 Github에서 README 데이터를 가져오는 중: {}", apiUrl);

        try {
            var request = restClient.get()
                .uri(apiUrl)
                .header("Accept", "application/vnd.github.v3.raw");

            if (token != null && !token.isBlank()) {
                request.header("Authorization", "Bearer " + token);
            }

            return request.retrieve().body(String.class);

        } catch (Exception e) {
            log.error("❌ Github README 가져오기 실패: {}", e.getMessage());
            return "README 정보가 없거나 가져올 수 없습니다.";
        }
    }
}
