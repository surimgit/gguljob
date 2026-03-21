// PortfolioResponse.java
package com.ssafy.gguljob.backend.domain.user.dto;

public class PortfolioResponse {

    public record GenerateResult(
        Long portfolioId,
        String s3Url,
        String title,
        boolean isPublic
    ) {}
}