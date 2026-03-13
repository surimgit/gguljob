package com.ssafy.gguljob.backend.domain.troubleshooting.repository;

import com.ssafy.gguljob.backend.domain.troubleshooting.entity.Troubleshooting;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TroubleshootingRepository extends JpaRepository<Troubleshooting, Long> {

    // 프로젝트 전체 트러블슈팅 개수
    long countByProject_Id(Long projectId);

    // 마이페이지 위젯용
    List<Troubleshooting> findTop2ByProject_IdOrderByCreatedAtDesc(Long projectId);
}