package com.ssafy.gguljob.backend.domain.matching.repository;

import com.ssafy.gguljob.backend.domain.matching.entity.ProjectNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;

public interface ProjectNodeRepository extends Neo4jRepository<ProjectNode, String> {
}