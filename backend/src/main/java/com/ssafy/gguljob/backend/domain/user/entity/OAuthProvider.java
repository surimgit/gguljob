package com.ssafy.project.backend.domain.user.entity;
import com.ssafy.project.backend.domain.user.type.OAuthProviderType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "oauth_providers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OAuthProvider {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "oauth_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OAuthProviderType provider;

    @Column(name = "provider_account_id", nullable = false, length = 100)
    private String providerAccountId;

    @Column(name = "access_token", length = 255)
    private String accessToken;
}