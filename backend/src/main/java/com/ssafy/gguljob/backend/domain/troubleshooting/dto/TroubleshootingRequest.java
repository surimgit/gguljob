package com.ssafy.gguljob.backend.domain.troubleshooting.dto;

public class TroubleshootingRequest {
    public record GenerateFromCommit(
        Long projectId,
        Long prId
    ) {}

}
