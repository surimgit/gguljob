package com.ssafy.gguljob.backend.swagger;

import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

@Configuration
public class SwaggerConfig {

        @Bean
        public OpenAPI gguljobOpenAPI() {
                String schemeName = "bearerAuth";
                SecurityRequirement securityRequirement =
                                new SecurityRequirement().addList(schemeName);

                return new OpenAPI()
                                .info(new Info().title("🐝🍯 꿀잡 API 명세서").description("위잉이이이잉")
                                                .version("v1.0.0"))
                                .addServersItem(new Server().url("https://j14e107.p.ssafy.io:8443")
                                                .description("Dev 서버"))
                                .addServersItem(new Server().url("https://j14e107.p.ssafy.io")
                                                .description("Prod 서버"))
                                .components(new Components().addSecuritySchemes(schemeName,
                                                new SecurityScheme().type(SecurityScheme.Type.HTTP)
                                                                .scheme("bearer")
                                                                .bearerFormat("JWT")))
                                .addSecurityItem(securityRequirement);
        }

        @Bean
        public OpenApiCustomizer globalOpenApiCustomizer() {
                return openApi -> openApi.getPaths().values().forEach(
                                pathItem -> pathItem.readOperations().forEach(operation -> {
                                        operation.getResponses().addApiResponse("400",
                                                        new io.swagger.v3.oas.models.responses.ApiResponse()
                                                                        .description("유효하지 않은 데이터 (BadRequestException)"))
                                                        .addApiResponse("401",
                                                                        new io.swagger.v3.oas.models.responses.ApiResponse()
                                                                                        .description("인증되지 않은 사용자 (UnAuthorizedException)"))
                                                        .addApiResponse("403",
                                                                        new io.swagger.v3.oas.models.responses.ApiResponse()
                                                                                        .description("권한이 없는 사용자 요청 (ForbiddenException)"))
                                                        .addApiResponse("404",
                                                                        new io.swagger.v3.oas.models.responses.ApiResponse()
                                                                                        .description("DB에 데이터 없음 (ResourceNotFoundException)"))
                                                        .addApiResponse("409",
                                                                        new io.swagger.v3.oas.models.responses.ApiResponse()
                                                                                        .description("데이터 중복 발생 (DuplicateResourceException)"));
                                }));
        }
}
