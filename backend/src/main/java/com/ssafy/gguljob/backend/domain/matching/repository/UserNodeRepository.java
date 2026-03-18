package com.ssafy.gguljob.backend.domain.matching.repository;

import com.ssafy.gguljob.backend.domain.matching.entity.UserNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;

public interface UserNodeRepository extends Neo4jRepository<UserNode, String> {
}