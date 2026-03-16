LOAD CSV WITH HEADERS FROM 'file:///job_requires_skills.csv' AS row
MATCH (j:Job {id: toInteger(row.job_id)})
MATCH (s:Skill {id: toInteger(row.skill_id)})
MERGE (j)-[:REQUIRES_SKILL]->(s);

MATCH ()-[r:REQUIRES_SKILL]->() RETURN 'Job_Requires_Skills' AS type, count(r) AS count;
