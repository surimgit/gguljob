package com.ssafy.gguljob.backend.domain.user.repository;

import com.ssafy.gguljob.backend.domain.user.entity.User;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // 이메일로 가입된 유저가 있는지 찾기
    Optional<User> findByEmail(String email);

    List<User> findByEmailIn(Collection<String> emails);
}