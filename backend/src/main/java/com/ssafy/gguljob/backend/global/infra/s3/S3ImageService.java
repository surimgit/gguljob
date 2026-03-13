package com.ssafy.gguljob.backend.global.infra.s3;

import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
public class S3ImageService {
    // S3 세팅 완료 후 아래 주석들 풀기
    // private final AmazonS3 amazonS3;
    // @Value("${cloud.aws.s3.bucket}")
    // private String bucket;

    public String uploadProfileImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }

        // 파일명 중복 방지를 위한 UUID 생성 (리사이즈나 확장자 처리도 여기서 가능)
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String s3FileName = "profiles/" + UUID.randomUUID().toString().substring(0, 10) + originalFilename;

        log.info("S3 업로드 시도 (Mock) - 파일명: {}", s3FileName);

        /* S3 세팅 완료 후 여기 주석 풀기
        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(file.getContentType());
            metadata.setContentLength(file.getSize());

            amazonS3.putObject(bucket, s3FileName, file.getInputStream(), metadata);
            return amazonS3.getUrl(bucket, s3FileName).toString();
        } catch (IOException e) {
            log.error("S3 업로드 에러: {}", e.getMessage());
            throw new RuntimeException("이미지 업로드에 실패했습니다.");
        }
        */

        // 지금은 S3가 없으니 가짜(Mock) URL을 반환
        return "https://gguljob-mock-s3-bucket.com/" + s3FileName;
    }
}
