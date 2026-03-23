// PortfolioRequest.java
package com.ssafy.gguljob.backend.domain.user.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public class PortfolioRequest {

    public record Generate(
        @NotEmpty(message = "트러블슈팅 ID는 1개 이상 필요합니다.")
        @Size(max = 20, message = "한 번에 최대 20개까지 선택 가능합니다.")
        List<Long> tsIds
    ) {}
}