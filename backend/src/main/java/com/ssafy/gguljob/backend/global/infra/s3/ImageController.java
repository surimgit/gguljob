package com.ssafy.gguljob.backend.global.infra.s3;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/images")
@RequiredArgsConstructor
public class ImageController {

  private final S3ImageService s3ImageService;

  @PostMapping("/upload")
  public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
    String s3Key = s3ImageService.uploadImage(file);
    String finalUrl = s3ImageService.getImageUrl(s3Key);
    return ResponseEntity.ok(finalUrl);
  }
}
