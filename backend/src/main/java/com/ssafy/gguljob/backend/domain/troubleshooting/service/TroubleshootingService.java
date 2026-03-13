package com.ssafy.gguljob.backend.domain.troubleshooting.service;

import com.ssafy.gguljob.backend.domain.troubleshooting.dto.TroubleShootingResponse;
import com.ssafy.gguljob.backend.domain.troubleshooting.repository.TroubleshootingRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class TroubleshootingService {
    private final TroubleshootingRepository troubleshootingRepository;

    public List<TroubleShootingResponse.Widget> getMyWidgetList(Long userId) {
        return troubleshootingRepository.findTop2ByProject_IdOrderByCreatedAtDesc(userId)
            .stream()
            .map(TroubleShootingResponse.Widget::from)
            .collect(Collectors.toList());
    }
}
