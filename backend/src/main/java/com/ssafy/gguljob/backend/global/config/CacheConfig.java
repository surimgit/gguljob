package com.ssafy.gguljob.backend.global.config;

import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Pageable;

import com.github.benmanes.caffeine.cache.Caffeine;

@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                "allJobsScoring",
                "projectRecommend",
                "memberRecommend"
        );
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(1, TimeUnit.HOURS)
                .maximumSize(500));
        return cacheManager;
    }

    /**
     * 추천 API 캐시 키 생성기
     * - List 파라미터는 정렬 후 직렬화 (순서 달라도 동일 키)
     * - Pageable은 pageNumber + pageSize만 추출
     */
    @Bean("recommendationKeyGenerator")
    public KeyGenerator recommendationKeyGenerator() {
        return (target, method, params) -> {
            StringBuilder sb = new StringBuilder();
            for (Object param : params) {
                if (param instanceof List<?> list) {
                    List<String> sorted = list.stream()
                            .map(String::valueOf)
                            .sorted()
                            .toList();
                    sb.append(sorted);
                } else if (param instanceof Pageable pageable) {
                    sb.append("p").append(pageable.getPageNumber())
                      .append("s").append(pageable.getPageSize());
                } else {
                    sb.append(param);
                }
                sb.append("_");
            }
            return sb.toString();
        };
    }
}
