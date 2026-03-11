package com.ssafy.gguljob.backend.domain.github.repository;

import com.ssafy.gguljob.backend.domain.github.entity.Troubleshooting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TroubleshootingRepository extends JpaRepository<Troubleshooting, Long> {

    // 프로젝트 전체 트러블슈팅 개수
    long countByProject_Id(Long projectId);
}