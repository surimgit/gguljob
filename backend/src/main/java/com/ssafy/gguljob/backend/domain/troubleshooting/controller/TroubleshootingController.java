package com.ssafy.gguljob.backend.domain.troubleshooting.controller;

import com.ssafy.gguljob.backend.domain.troubleshooting.service.TroubleshootingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/troubleshooting")
@RequiredArgsConstructor
public class TroubleshootingController {
    private final TroubleshootingService troubleshootingService;
}
