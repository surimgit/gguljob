package com.ssafy.gguljob.backend.domain.user.repository;

import com.ssafy.gguljob.backend.domain.user.entity.Portfolio;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    long countByUser(User user);
}
