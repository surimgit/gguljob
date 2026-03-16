#!/bin/bash
sudo docker exec gguljob-neo4j-dev cypher-shell \
  -u neo4j \
  -p 'default-neo4j-password-please-change-in-production' \
  --format plain \
  --file /var/lib/neo4j/import/check_requires_skill.cypher \
  > /tmp/neo4j_result.txt 2>&1
echo "EXIT:$?"
cat /tmp/neo4j_result.txt
