// PortfolioResponse.java
package com.ssafy.gguljob.backend.domain.user.dto;

import com.ssafy.gguljob.backend.domain.user.entity.Portfolio;
import java.time.LocalDateTime;

public class PortfolioResponse {

    public record GenerateResult(
        Long portfolioId,
        String s3Url,
        String title,
        boolean isPublic
    ) {}

    public record Summary(
        Long portfolioId,
        String title,
        String s3Url,
        boolean isPublic,
        LocalDateTime updatedAt
    ) {
        public static Summary from(Portfolio portfolio) {
            return new Summary(
                portfolio.getId(),
                portfolio.getTitle(),
                portfolio.getS3Url(),
                portfolio.getIsPublic(),
                portfolio.getUpdatedAt()
            );
        }
    }
}
