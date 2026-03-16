// ==================== 1. CONSTRAINT (없으면 생성) ====================
CREATE CONSTRAINT job_id_unique IF NOT EXISTS FOR (j:Job) REQUIRE j.id IS UNIQUE;
CREATE CONSTRAINT skill_id_unique IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE;

// ==================== 2. JOB 노드 로드 ====================
LOAD CSV WITH HEADERS FROM 'file:///jobs.csv' AS row
MERGE (j:Job {id: toInteger(row.id)})
SET j.originJobId = row.originJobId,
    j.title = row.title,
    j.experienceLevel = row.experience_level,
    j.salary = row.salary;

// ==================== 3. SKILL 노드 로드 ====================
LOAD CSV WITH HEADERS FROM 'file:///skills.csv' AS row
MERGE (s:Skill {id: toInteger(row.id)})
SET s.name = row.name;

// ==================== 4. USER 노드 로드 ====================
LOAD CSV WITH HEADERS FROM 'file:///users.csv' AS row
MERGE (u:User {id: toInteger(row.id)})
SET u.name = row.name;

// ==================== 5. USER-SKILL 관계 로드 ====================
LOAD CSV WITH HEADERS FROM 'file:///user_skills.csv' AS row
MATCH (u:User {id: toInteger(row.user_id)})
MATCH (s:Skill {id: toInteger(row.skill_id)})
MERGE (u)-[:HAS_SKILL]->(s);

// ==================== 6. JOB-SKILL 관계 로드 ====================
LOAD CSV WITH HEADERS FROM 'file:///job_requires_skills.csv' AS row
CALL {
  WITH row
  MATCH (j:Job {id: toInteger(row.job_id)})
  MATCH (s:Skill {id: toInteger(row.skillId)})
  MERGE (j)-[r:REQUIRES_SKILL]->(s)
  SET r.weight = toFloat(row.weight)
} IN TRANSACTIONS OF 1000 ROWS;

// ==================== 7. 결과 확인 ====================
MATCH (j:Job) RETURN 'Job' AS label, count(j) AS count
UNION ALL
MATCH (s:Skill) RETURN 'Skill' AS label, count(s) AS count
UNION ALL
MATCH (u:User) RETURN 'User' AS label, count(u) AS count
UNION ALL
MATCH ()-[r:HAS_SKILL]->() RETURN 'User_HAS_SKILL' AS label, count(r) AS count
UNION ALL
MATCH ()-[r:REQUIRES_SKILL]->() RETURN 'Job_REQUIRES_SKILL' AS label, count(r) AS count;
