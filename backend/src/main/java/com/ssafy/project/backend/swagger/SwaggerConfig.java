package com.ssafy.project.backend.swagger; // 본인 프로젝트 패키지명으로 수정하십쇼!

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI gguljobOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("🐝 꿀잡 API 명세서")
                .description("위잉위잉")
                .version("v1.0.0"));
    }
}