package com.ssafy.gguljob.backend.domain.user.entity;

import com.ssafy.gguljob.backend.domain.user.dto.ProfileUpdateRequestDto;
import com.ssafy.gguljob.backend.domain.user.type.ExperienceLevel;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import com.ssafy.gguljob.backend.domain.user.type.RoleType;
import com.ssafy.gguljob.backend.domain.user.type.TeamTendency;
import com.ssafy.gguljob.backend.global.entity.BaseTimeEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "user_name", length = 20)
    private String userName;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(length = 255)
    private String description;

    @Column(length = 4)
    private String mbti;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20)
    private List<PositionType> roles = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private ExperienceLevel experience;

    @Enumerated(EnumType.STRING)
    @Column(name = "team_tendency", length = 50)
    private TeamTendency teamTendency;

    @Column(name = "profile_image_url", length = 255)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private RoleType authority;

    @Builder
    public User(String userName, String email, String imageUrl, RoleType authority) {
        this.userName = userName;
        this.email = email;
        this.imageUrl = imageUrl;
        this.authority = authority;
    }

    public void updateGithubProfile(String userName, String imageUrl) {
        this.userName = userName;
        this.imageUrl = imageUrl;
    }

    public void updateOnboarding(String description, List<PositionType> roles, ExperienceLevel experience, String mbti, TeamTendency teamTendency) {
        this.description = description;
        this.roles.clear();
        if(roles != null) {
            this.roles.addAll(roles);
        }
        this.experience = experience;
        this.mbti = mbti;
        this.teamTendency = teamTendency;
    }

    //  프로필 정보 수정용
    public void updateProfile(ProfileUpdateRequestDto request) {
        if (request.getDescription() != null) this.description = request.getDescription();
        if (request.getRoles() != null) {
            this.roles.clear();
            this.roles.addAll(request.getRoles());
        }
        if (request.getExperience() != null) this.experience = request.getExperience();
        if (request.getMbti() != null) this.mbti = request.getMbti();
        if (request.getTeamTendency() != null) this.teamTendency = request.getTeamTendency();
    }
}