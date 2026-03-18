package com.ssafy.gguljob.backend.domain.user.entity;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.BatchSize;
import org.springframework.util.StringUtils;

import com.ssafy.gguljob.backend.domain.user.dto.ProfileUpdateRequestDto;
import com.ssafy.gguljob.backend.domain.user.type.ExperienceLevel;
import com.ssafy.gguljob.backend.domain.user.type.PositionType;
import com.ssafy.gguljob.backend.domain.user.type.RoleType;
import com.ssafy.gguljob.backend.domain.user.type.TeamTendency;
import com.ssafy.gguljob.backend.global.entity.BaseTimeEntity;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
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
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
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
    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private RoleType authority;

    // 유저의 기술 스택 조회를 위한 OneToMany 매핑
    @BatchSize(size = 100)
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<com.ssafy.gguljob.backend.domain.skill.entity.UserSkill> userSkills =
            new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserGoal> goals = new ArrayList<>();

    @Builder
    public User(String userName, String email, String profileImageUrl, RoleType authority) {
        this.userName = userName;
        this.email = email;
        this.profileImageUrl = profileImageUrl;
        this.authority = authority;
    }

    public void updateGithubProfile(String userName, String imageUrl) {
        this.userName = userName;
        this.profileImageUrl = imageUrl;
    }

    public void updateOnboarding(String description, List<PositionType> roles,
            ExperienceLevel experience, String mbti, TeamTendency teamTendency) {
        this.description = description;
        this.roles.clear();
        if (roles != null) {
            this.roles.addAll(roles);
        }
        this.experience = experience;
        this.mbti = mbti;
        this.teamTendency = teamTendency;
    }

    // 프로필 정보 수정용
    public void updateProfile(ProfileUpdateRequestDto request) {
        if (request.getDescription() != null)
            this.description = request.getDescription();
        if (request.getRoles() != null) {
            this.roles.clear();
            this.roles.addAll(request.getRoles());
        }
        if (request.getExperience() != null)
            this.experience = request.getExperience();
        if (!StringUtils.hasText(request.getMbti())) {
            this.mbti = null;
        } else {
            this.mbti = request.getMbti().trim().toUpperCase();
        }
        if (request.getTeamTendency() != null)
            this.teamTendency = request.getTeamTendency();
    }

    public void updateImageUrl(String imageUrl) {
        this.profileImageUrl = imageUrl;
    }

    public String getUserName() {
        return userName;
    }

    public String getEmail() {
        return email;
    }


}
