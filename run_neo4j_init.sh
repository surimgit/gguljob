#!/bin/bash
set -e

CONTAINER="gguljob-neo4j-dev"
NEO4J_PW="default-neo4j-password-please-change-in-production"

echo "[1] Copying cypher file into container..."
sudo docker cp /tmp/neo4j_init_all.cypher ${CONTAINER}:/var/lib/neo4j/import/neo4j_init_all.cypher

echo "[2] Running cypher script (this may take a while)..."
sudo docker exec ${CONTAINER} cypher-shell \
  -u neo4j \
  -p "${NEO4J_PW}" \
  --file /var/lib/neo4j/import/neo4j_init_all.cypher \
  > /tmp/neo4j_init_result.txt 2>&1
EXIT_CODE=$?

echo "[3] Exit code: ${EXIT_CODE}"
echo "[4] Output:"
cat /tmp/neo4j_init_result.txt
