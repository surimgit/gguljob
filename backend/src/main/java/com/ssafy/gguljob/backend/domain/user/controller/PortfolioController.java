package com.ssafy.gguljob.backend.domain.user.controller;

import com.ssafy.gguljob.backend.domain.user.dto.PortfolioRequest;
import com.ssafy.gguljob.backend.domain.user.dto.PortfolioResponse;
import com.ssafy.gguljob.backend.domain.user.service.PortfolioService;
import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController("/api/v1/portfolios")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @PostMapping("/generate")
    public ResponseEntity<PortfolioResponse.GenerateResult> generatePortfolio(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody PortfolioRequest.Generate request
    ) {
        PortfolioResponse.GenerateResult result =
            portfolioService.generatePortfolio(userDetails.getId(), request);
        return ResponseEntity.ok(result);
    }
}
