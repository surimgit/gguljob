package com.ssafy.gguljob.backend.global.infra.s3;

import com.amazonaws.services.s3.model.S3Object;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;

import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3ImageService {

    private final AmazonS3 amazonS3;

    @Value("${cdn.url}")
    private String cdnUrl;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    // 1. 업로드 로직
    public String uploadImage(MultipartFile file) {
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        String s3Key = "uploads/" + fileName; // S3에 저장될 경로

        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(file.getContentType());

            amazonS3.putObject(
                    new PutObjectRequest(bucket, s3Key, file.getInputStream(), metadata));

        } catch (IOException e) {
            throw new RuntimeException("S3 파일 스트림 읽기 실패: " + e.getMessage());
        }

        return s3Key;
    }

    // MD 텍스트 업로드
    public String uploadMarkdown(String content, String s3Key) {
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(bytes.length);
        metadata.setContentType("text/markdown; charset=UTF-8");

        amazonS3.putObject(
            new PutObjectRequest(bucket, s3Key, new ByteArrayInputStream(bytes), metadata)
        );

        return s3Key;
    }

    // 2. 조회/응답 로직
    public String getImageUrl(String s3Key) {
        // DB에서 꺼낸 s3Key 앞에 CDN 도메인을 붙여서 프론트엔드로 반환
        return cdnUrl + "/" + s3Key;
    }

    public String extractS3Key(String cdnUrl) {
        // "https://cdn.example.com/portfolios/1/파일.md" → "portfolios/1/파일.md"
        return cdnUrl.replace(this.cdnUrl + "/", "");
    }

    // S3에서 객체 가져오기
    public S3Object getObject(String s3Key) {
        return amazonS3.getObject(bucket, s3Key);
    }
}
