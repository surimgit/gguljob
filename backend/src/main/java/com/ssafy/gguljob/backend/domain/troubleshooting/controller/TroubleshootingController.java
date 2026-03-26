package com.ssafy.gguljob.backend.domain.troubleshooting.controller;

import com.ssafy.gguljob.backend.domain.troubleshooting.dto.TroubleshootingRequest;
import com.ssafy.gguljob.backend.domain.troubleshooting.dto.TroubleshootingResponse;
import com.ssafy.gguljob.backend.domain.troubleshooting.service.TroubleshootingService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/troubleshooting")
@RequiredArgsConstructor
@Tag(name = "TroubleShooting", description = "트러블슈팅 관련 API")
public class TroubleshootingController {

    private final TroubleshootingService troubleshootingService;

    @Operation(summary = "내 트러블슈팅 목록 조회", description = "로그인한 유저의 전체 트러블슈팅 목록을 최신 생성순으로 조회 (페이지네이션)")
    @GetMapping("/my")
    public ResponseEntity<Page<TroubleshootingResponse.ListItem>> getMyTroubleshootings(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "5") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<TroubleshootingResponse.ListItem> result = troubleshootingService.getMyTroubleshootings(userDetails.getId(), pageable);
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "트러블슈팅 AI 기반 생성", description = "브랜치를 선택해야 함")
    @PostMapping("/generate")
    public ResponseEntity<TroubleshootingResponse.GenerateResult> generateFromCommit(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestBody TroubleshootingRequest.GenerateFromCommit request) {

        TroubleshootingResponse.GenerateResult response = troubleshootingService.generateAndSaveTroubleshooting(userDetails.getId(), request);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "트러블슈팅 내용 수정", description = "작성자 본인만 트러블슈팅의 내용을 수정")
    @PutMapping("/{troubleshootingId}")
    public ResponseEntity<Void> updateTroubleshooting(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long troubleshootingId,
        @RequestBody TroubleshootingRequest.Update request) {

        troubleshootingService.updateTroubleshooting(userDetails.getId(), troubleshootingId, request);

        return ResponseEntity.ok().build();
    }

}
