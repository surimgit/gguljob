#!/bin/bash
# ================================================================
# Neo4j 전체 초기화: MySQL -> CSV -> Neo4j
# EC2 서버에서 직접 실행하는 스크립트
# ================================================================
set -e

DB_CONTAINER="gguljob-db-dev"
NEO4J_CONTAINER="gguljob-neo4j-dev"
DB_NAME="gguljob_dev"
DB_ROOT_PASS='TAiqM4E#+kMtwXCS'
NEO4J_PW="default-neo4j-password-please-change-in-production"
IMPORT_DIR="/var/lib/neo4j/import"
TMP_DIR="/tmp/neo4j_export"

mkdir -p ${TMP_DIR}

echo "=============================="
echo " [STEP 1] MySQL -> CSV export"
echo "=============================="

# ----- 1-1. jobs.csv -----
echo "[1-1] jobs.csv ..."
printf "id,title,experience_level\n" > ${TMP_DIR}/jobs.csv
sudo docker exec ${DB_CONTAINER} \
  mysql -uroot "-p${DB_ROOT_PASS}" ${DB_NAME} \
  --batch --skip-column-names \
  -e "SELECT posting_id, REPLACE(IFNULL(title,''), ',', ' '), REPLACE(IFNULL(experience_level,''), ',', ' ') FROM job_posting ORDER BY posting_id;" \
  2>/dev/null \
  | sed 's/\t/,/g' >> ${TMP_DIR}/jobs.csv
echo "   -> $(( $(wc -l < ${TMP_DIR}/jobs.csv) - 1 )) rows"

# ----- 1-2. skills.csv -----
echo "[1-2] skills.csv ..."
printf "id,name\n" > ${TMP_DIR}/skills.csv
sudo docker exec ${DB_CONTAINER} \
  mysql -uroot "-p${DB_ROOT_PASS}" ${DB_NAME} \
  --batch --skip-column-names \
  -e "SELECT skill_id, REPLACE(IFNULL(name,''), ',', ' ') FROM skill ORDER BY skill_id;" \
  2>/dev/null \
  | sed 's/\t/,/g' >> ${TMP_DIR}/skills.csv
echo "   -> $(( $(wc -l < ${TMP_DIR}/skills.csv) - 1 )) rows"

# ----- 1-3. users.csv -----
echo "[1-3] users.csv ..."
printf "id,name\n" > ${TMP_DIR}/users.csv
sudo docker exec ${DB_CONTAINER} \
  mysql -uroot "-p${DB_ROOT_PASS}" ${DB_NAME} \
  --batch --skip-column-names \
  -e "SELECT user_id, REPLACE(IFNULL(user_name,'unknown'), ',', ' ') FROM users ORDER BY user_id;" \
  2>/dev/null \
  | sed 's/\t/,/g' >> ${TMP_DIR}/users.csv
echo "   -> $(( $(wc -l < ${TMP_DIR}/users.csv) - 1 )) rows"

# ----- 1-4. user_skills.csv -----
echo "[1-4] user_skills.csv ..."
printf "user_id,skill_id\n" > ${TMP_DIR}/user_skills.csv
sudo docker exec ${DB_CONTAINER} \
  mysql -uroot "-p${DB_ROOT_PASS}" ${DB_NAME} \
  --batch --skip-column-names \
  -e "SELECT user_id, skill_id FROM user_skill ORDER BY user_id, skill_id;" \
  2>/dev/null \
  | sed 's/\t/,/g' >> ${TMP_DIR}/user_skills.csv
echo "   -> $(( $(wc -l < ${TMP_DIR}/user_skills.csv) - 1 )) rows"

# ----- 1-5. job_requires_skills.csv -----
echo "[1-5] job_requires_skills.csv ..."
printf "job_id,skillId,weight\n" > ${TMP_DIR}/job_requires_skills.csv
sudo docker exec ${DB_CONTAINER} \
  mysql -uroot "-p${DB_ROOT_PASS}" ${DB_NAME} \
  --batch --skip-column-names \
  -e "SELECT posting_id, skill_id FROM job_posting_skill ORDER BY posting_id, skill_id;" \
  2>/dev/null \
  | awk '{printf "%s,%s,1.0\n", $1, $2}' >> ${TMP_DIR}/job_requires_skills.csv
echo "   -> $(( $(wc -l < ${TMP_DIR}/job_requires_skills.csv) - 1 )) rows"

echo ""
echo "=============================="
echo " [STEP 2] CSV -> Neo4j 컨테이너 복사"
echo "=============================="
for f in jobs.csv skills.csv users.csv user_skills.csv job_requires_skills.csv; do
  sudo docker cp ${TMP_DIR}/${f} ${NEO4J_CONTAINER}:${IMPORT_DIR}/${f}
  echo "   Copied: ${f}"
done

echo ""
echo "=============================="
echo " [STEP 3] Neo4j 기존 데이터 삭제"
echo "=============================="
sudo docker exec ${NEO4J_CONTAINER} cypher-shell \
  -u neo4j -p "${NEO4J_PW}" \
  --file ${IMPORT_DIR}/neo4j_clear.cypher 2>&1 || true

echo ""
echo "=============================="
echo " [STEP 4] Neo4j 전체 데이터 로드"
echo "=============================="
sudo docker exec ${NEO4J_CONTAINER} cypher-shell \
  -u neo4j -p "${NEO4J_PW}" \
  --file ${IMPORT_DIR}/neo4j_load_all.cypher 2>&1

echo ""
echo "=============================="
echo " DONE!"
echo "=============================="
