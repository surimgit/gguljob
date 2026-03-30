package com.ssafy.gguljob.backend.domain.user.dto;

import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import java.util.Arrays;
import java.util.List;

public class PositionResponse {

    public record PositionDto(
        String code,
        String name
    ) {
        public static PositionDto from(PositionType type) {
            return new PositionDto(type.name(), type.getDescription());
        }
    }

    public static List<PositionDto> allPositions() {
        return Arrays.stream(PositionType.values())
            .map(PositionDto::from)
            .toList();
    }
}
