package com.ssafy.gguljob.backend.domain.troubleshooting.dto;

import com.ssafy.gguljob.backend.domain.user.type.PositionType;

public class TroubleshootingRequest {
    public record GenerateFromCommit(
        Long projectId,
        Long prId
    ) {}

    public record Update(
        String title,
        PositionType role,
        String language,
        String framework,
        String situation,
        String solution
    ) {}

}
