package com.ssafy.gguljob.backend.domain.github.repository;

import com.ssafy.gguljob.backend.domain.github.entity.GitRepository;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GitRepositoryRepository extends JpaRepository<GitRepository, Long> {

    Optional<GitRepository> findByProject_Id(Long projectId);
}