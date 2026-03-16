MATCH ()-[r:REQUIRES_SKILL]->() RETURN 'Job_Requires_Skills' AS type, count(r) AS count;
