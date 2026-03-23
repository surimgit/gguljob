package com.ssafy.gguljob.backend.global.api;

import org.springframework.http.HttpStatus;

public interface ErrorCode {
    HttpStatus status();
    String defaultMessage();
    String code();
}