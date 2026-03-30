package com.ssafy.gguljob.backend.domain.user.repository;

import com.ssafy.gguljob.backend.domain.matching.service.MatchingService;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Long> {
    // 이메일로 가입된 유저가 있는지 찾기
    Optional<User> findByEmail(String email);

    List<User> findByEmailIn(Collection<String> emails);

    Optional<User> findByGithubNickname(String githubNickname);

    List<User> findByGithubNicknameIn(Collection<String> githubNicknames);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE u.id IN :userIds")
    List<User> findUsersWithRolesByIds(@org.springframework.data.repository.query.Param("userIds") List<Long> userIds);

@Query("SELECT u.id FROM User u WHERE SIZE(u.roles) > 0")
    List<Long> findAllOnboardedUserIds();
}