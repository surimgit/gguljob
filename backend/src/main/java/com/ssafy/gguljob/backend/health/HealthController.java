package com.ssafy.gguljob.backend.health;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    /**
     * 애플리케이션 버전.
     *
     * <p>{@code application.properties}의 {@code app.version} 값을 사용한다.</p>
     */
    @Value("${app.version:1.0.0}")
    private String appVersion;

    /**
     * 헬스체크 API.
     *
     * <p>서버가 정상 기동 중일 경우 {@code status=UP}을 반환한다.</p>
     *
     * @return 헬스 상태 응답
     */
    @GetMapping
    public ResponseEntity<HealthData> health() {
        var data = new HealthData("UP", appVersion);

        return ResponseEntity.ok(data);
    }

    /**
     * 헬스체크 응답 데이터.
     *
     * @param status 서버 상태 (UP)
     * @param version 애플리케이션 버전
     */
    public record HealthData(String status, String version) {}
}
