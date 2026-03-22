package com.ssafy.gguljob.backend.domain.user.controller;

import com.ssafy.gguljob.backend.domain.user.dto.PortfolioRequest;
import com.ssafy.gguljob.backend.domain.user.dto.PortfolioResponse;
import com.ssafy.gguljob.backend.domain.user.service.PortfolioService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import com.ssafy.gguljob.backend.global.dto.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/portfolios")
@RequiredArgsConstructor
@Tag(name = "포트폴리오 API", description = "포트폴리오 생성 및 조회 관련 API")
public class PortfolioController {

    private final PortfolioService portfolioService;

    @Operation(summary = "내 포트폴리오 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponseDto<List<PortfolioResponse.Summary>>> getMyPortfolios(
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<PortfolioResponse.Summary> result =
            portfolioService.getMyPortfolios(userDetails.getId());
        return ResponseEntity.ok(new ApiResponseDto<>(200, "포트폴리오 목록 조회 성공", result));
    }

    @Operation(summary = "포트폴리오 생성")
    @PostMapping("/generate")
    public ResponseEntity<ApiResponseDto<PortfolioResponse.GenerateResult>> generatePortfolio(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody PortfolioRequest.Generate request
    ) {
        PortfolioResponse.GenerateResult result =
            portfolioService.generatePortfolio(userDetails.getId(), request);
        return ResponseEntity.ok(new ApiResponseDto<>(200, "포트폴리오 생성 성공", result));
    }
}

