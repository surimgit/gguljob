package com.ssafy.gguljob.backend.domain.user.controller;

import com.amazonaws.services.s3.model.S3Object;
import com.ssafy.gguljob.backend.domain.user.dto.PortfolioRequest;
import com.ssafy.gguljob.backend.domain.user.dto.PortfolioResponse;
import com.ssafy.gguljob.backend.domain.user.entity.Portfolio;
import com.ssafy.gguljob.backend.domain.user.repository.PortfolioRepository;
import com.ssafy.gguljob.backend.domain.user.service.PortfolioService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import com.ssafy.gguljob.backend.global.dto.ApiResponseDto;
import com.ssafy.gguljob.backend.global.exception.ForbiddenException;
import com.ssafy.gguljob.backend.global.infra.s3.S3ImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
    private final S3ImageService s3ImageService;
    private final PortfolioRepository portfolioRepository;

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

    @Operation(summary = "포트폴리오 제목 수정")
    @PatchMapping("/{portfolioId}/title")
    public ResponseEntity<Void> updatePortfolioTitle(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long portfolioId,
        @Valid @RequestBody PortfolioRequest.UpdateTitle request
    ) {
        portfolioService.updateTitle(userDetails.getId(), portfolioId, request.title().trim());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "포트폴리오 삭제")
    @DeleteMapping("/{portfolioId}")
    public ResponseEntity<Void> deletePortfolio(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long portfolioId
    ) {
        portfolioService.deletePortfolio(userDetails.getId(), portfolioId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{portfolioId}/download")
    public ResponseEntity<byte[]> downloadPortfolio(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long portfolioId
    ) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 포트폴리오입니다."));

        if (!portfolio.getUser().getId().equals(userDetails.getId())) {
            throw new ForbiddenException("본인의 포트폴리오만 다운로드할 수 있습니다.");
        }

        // ✅ CDN URL → s3Key 파싱
        String s3Key = s3ImageService.extractS3Key(portfolio.getS3Url());

        try (S3Object s3Object = s3ImageService.getObject(s3Key)) {
            byte[] content = s3Object.getObjectContent().readAllBytes();

            String encodedFileName = URLEncoder.encode("포트폴리오.md", StandardCharsets.UTF_8)
                .replace("+", "%20");

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"portfolio.md\"; filename*=UTF-8''" + encodedFileName)
                .contentType(MediaType.parseMediaType("text/markdown; charset=UTF-8"))
                .contentLength(content.length)
                .body(content);

        } catch (IOException e) {
            throw new RuntimeException("포트폴리오 파일 다운로드 실패: " + e.getMessage());
        }
    }
}

