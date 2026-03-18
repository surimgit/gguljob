package com.ssafy.gguljob.backend.domain.user.dto;

import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.type.ExperienceLevel;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import java.util.List;
import org.springframework.data.domain.Page;

public class UserResponse {

    public record UserSummary(
        Long userId,
        String userName,
        String description,
        List<PositionType> roles,
        ExperienceLevel experience,
        String profileImageUrl
    ) {
        public static UserSummary from(User user) {
            return new UserSummary(
                user.getId(),
                user.getUserName(),
                user.getDescription(),
                user.getRoles(),
                user.getExperience(),
                user.getProfileImageUrl()
            );
        }
    }

    public record UserPageResponse(
        List<UserSummary> content,
        int pageNumber,
        int pageSize,
        long totalElements,
        int totalPages,
        boolean isLast
    ) {
        public static UserPageResponse of(Page<UserSummary> page) {
            return new UserPageResponse(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
            );
        }
    }

}
