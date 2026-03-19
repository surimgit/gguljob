package com.ssafy.gguljob.backend.global.infra.s3;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.ssafy.gguljob.backend.global.auth.CustomUserDetails;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/images")
@RequiredArgsConstructor
public class ImageController {

  private final S3ImageService s3ImageService;

  @PostMapping("/upload")
  public ResponseEntity<String> uploadImage(@AuthenticationPrincipal CustomUserDetails userDetails,
      @RequestParam("file") MultipartFile file) {

    // 1번 사용자(어드민/테스트)만 업로드 허용
    if (userDetails == null || userDetails.getId() != 1L) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body("허용되지 않은 접근입니다.");
    }

    String s3Key = s3ImageService.uploadImage(file);
    String finalUrl = s3ImageService.getImageUrl(s3Key);
    return ResponseEntity.ok(finalUrl);
  }
}
