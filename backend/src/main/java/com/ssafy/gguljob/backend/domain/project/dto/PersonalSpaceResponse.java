package com.ssafy.gguljob.backend.domain.project.dto;
import java.time.LocalDateTime;
import java.util.List;

public class PersonalSpaceResponse {

    public record Dashboard(
        Stats stats,
        List<PrItem> myPullRequests,
        List<ReviewItem> myReviews,
        List<TroubleshootingItem> myTroubleshootings
    ) {}

    public record Stats(
        long prCount,
        long reviewCount,
        long troubleshootingCount
    ) {}

    public record ReviewItem(
        Long reviewId,
        String reviewerName,
        String prTitle,
        Integer prNumber,
        String contentSnippet
    ) {}
}