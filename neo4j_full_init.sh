#!/bin/bash
# ================================================================
# Neo4j 전체 초기화 스크립트
# MySQL -> CSV -> Neo4j import
# ================================================================
set -e

DB_CONTAINER="gguljob-db-dev"
NEO4J_CONTAINER="gguljob-neo4j-dev"
DB_NAME="gguljob_dev"
DB_ROOT_PASS="TAiqM4E#+kMtwXCS"
NEO4J_PW="default-neo4j-password-please-change-in-production"
IMPORT_DIR="/var/lib/neo4j/import"
TMP_DIR="/tmp/neo4j_export"

echo "=============================="
echo " [STEP 0] 준비"
echo "=============================="
mkdir -p ${TMP_DIR}

# -------------------------------------------------------
echo "=============================="
echo " [STEP 1] MySQL -> CSV export (SQL 파일 방식)"
echo "=============================="

# SQL 파일 생성 (특수문자 비밀번호 이슈 우회)
cat > ${TMP_DIR}/export_jobs.sql << 'SQLEOF'
SELECT posting_id, origin_job_id, REPLACE(title, ',', '|'), experience_level
FROM job_posting
ORDER BY posting_id;
SQLEOF

cat > ${TMP_DIR}/export_skills.sql << 'SQLEOF'
SELECT skill_id, REPLACE(name, ',', '|') FROM skill ORDER BY skill_id;
SQLEOF

cat > ${TMP_DIR}/export_users.sql << 'SQLEOF'
SELECT user_id, IFNULL(user_name, 'unknown') FROM users ORDER BY user_id;
SQLEOF

cat > ${TMP_DIR}/export_user_skills.sql << 'SQLEOF'
SELECT user_id, skill_id FROM user_skill ORDER BY user_id, skill_id;
SQLEOF

cat > ${TMP_DIR}/export_job_skills.sql << 'SQLEOF'
SELECT posting_id, skill_id FROM job_posting_skill ORDER BY posting_id, skill_id;
SQLEOF

# SQL 파일을 컨테이너로 복사
for f in export_jobs.sql export_skills.sql export_users.sql export_user_skills.sql export_job_skills.sql; do
  sudo docker cp ${TMP_DIR}/${f} ${DB_CONTAINER}:/tmp/${f}
done

# 1-1. jobs.csv
echo "[1-1] Exporting jobs.csv ..."
echo "id,title,experience_level" > ${TMP_DIR}/jobs.csv
sudo docker exec ${DB_CONTAINER} mysql -uroot -p${DB_ROOT_PASS} ${DB_NAME} \
  --batch --skip-column-names < ${TMP_DIR}/export_jobs.sql \
  | sed 's/\t/,/g' \
  >> ${TMP_DIR}/jobs.csv
echo "   -> $(( $(wc -l < ${TMP_DIR}/jobs.csv) - 1 )) rows"

# 1-2. skills.csv
echo "[1-2] Exporting skills.csv ..."
echo "id,name" > ${TMP_DIR}/skills.csv
sudo docker exec ${DB_CONTAINER} mysql -uroot -p${DB_ROOT_PASS} ${DB_NAME} \
  --batch --skip-column-names < ${TMP_DIR}/export_skills.sql \
  | sed 's/\t/,/g' \
  >> ${TMP_DIR}/skills.csv
echo "   -> $(( $(wc -l < ${TMP_DIR}/skills.csv) - 1 )) rows"

# 1-3. users.csv
echo "[1-3] Exporting users.csv ..."
echo "id,name" > ${TMP_DIR}/users.csv
sudo docker exec ${DB_CONTAINER} mysql -uroot -p${DB_ROOT_PASS} ${DB_NAME} \
  --batch --skip-column-names < ${TMP_DIR}/export_users.sql \
  | sed 's/\t/,/g' \
  >> ${TMP_DIR}/users.csv
echo "   -> $(( $(wc -l < ${TMP_DIR}/users.csv) - 1 )) rows"

# 1-4. user_skills.csv
echo "[1-4] Exporting user_skills.csv ..."
echo "user_id,skill_id" > ${TMP_DIR}/user_skills.csv
sudo docker exec ${DB_CONTAINER} mysql -uroot -p${DB_ROOT_PASS} ${DB_NAME} \
  --batch --skip-column-names < ${TMP_DIR}/export_user_skills.sql \
  | sed 's/\t/,/g' \
  >> ${TMP_DIR}/user_skills.csv
echo "   -> $(( $(wc -l < ${TMP_DIR}/user_skills.csv) - 1 )) rows"

# 1-5. job_requires_skills.csv
echo "[1-5] Exporting job_requires_skills.csv ..."
echo "job_id,skillId,weight" > ${TMP_DIR}/job_requires_skills.csv
sudo docker exec ${DB_CONTAINER} mysql -uroot -p${DB_ROOT_PASS} ${DB_NAME} \
  --batch --skip-column-names < ${TMP_DIR}/export_job_skills.sql \
  | awk '{printf "%s,%s,1.0\n", $1, $2}' \
  >> ${TMP_DIR}/job_requires_skills.csv
echo "   -> $(( $(wc -l < ${TMP_DIR}/job_requires_skills.csv) - 1 )) rows"

# -------------------------------------------------------
echo "=============================="
echo " [STEP 2] CSV -> Neo4j import 디렉토리 복사"
echo "=============================="
for f in jobs.csv skills.csv users.csv user_skills.csv job_requires_skills.csv; do
  sudo docker cp ${TMP_DIR}/${f} ${NEO4J_CONTAINER}:${IMPORT_DIR}/${f}
  echo "   Copied: ${f}"
done

# -------------------------------------------------------
echo "=============================="
echo " [STEP 3] Neo4j 기존 데이터 전체 삭제"
echo "=============================="
sudo docker exec ${NEO4J_CONTAINER} cypher-shell \
  -u neo4j -p "${NEO4J_PW}" \
  --file ${IMPORT_DIR}/neo4j_clear.cypher \
  > /tmp/neo4j_clear_result.txt 2>&1 || true
cat /tmp/neo4j_clear_result.txt

# -------------------------------------------------------
echo "=============================="
echo " [STEP 4] Neo4j 전체 데이터 로드"
echo "=============================="
sudo docker exec ${NEO4J_CONTAINER} cypher-shell \
  -u neo4j -p "${NEO4J_PW}" \
  --file ${IMPORT_DIR}/neo4j_load_all.cypher \
  > /tmp/neo4j_load_result.txt 2>&1
EXIT_CODE=$?
echo "Exit code: ${EXIT_CODE}"
cat /tmp/neo4j_load_result.txt

echo ""
echo "=============================="
echo " DONE!"
echo "=============================="
