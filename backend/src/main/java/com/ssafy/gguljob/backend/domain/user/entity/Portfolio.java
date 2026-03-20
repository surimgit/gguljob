package com.ssafy.gguljob.backend.domain.user.entity;

import com.ssafy.gguljob.backend.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "portfolios")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Portfolio extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "portfolio_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "s3_url", nullable = false, length = 512)
    private String s3Url;

    @Column(name = "is_public", nullable = false, columnDefinition = "TINYINT")
    private Boolean isPublic = true;

    @Builder
    public Portfolio(User user, String title, String s3Url, Boolean isPublic) {
        this.user = user;
        this.title = title;
        this.s3Url = s3Url;
        this.isPublic = isPublic;
    }
}