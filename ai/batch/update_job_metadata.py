import os
import pandas as pd
import pymysql
import re
from dotenv import load_dotenv

load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3307"))
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DB = os.getenv("MYSQL_DB")

for var_name, var_val in [("MYSQL_USER", MYSQL_USER), ("MYSQL_PASSWORD", MYSQL_PASSWORD), ("MYSQL_DB", MYSQL_DB)]:
    if not var_val:
        raise ValueError(f"{var_name} 환경변수가 설정되지 않았습니다.")

CSV_PATH = os.getenv("JOB_CSV_PATH", os.path.join(os.path.dirname(__file__), "jobkorea_jobs_all_new.csv"))

print("1. 파일 읽는 중...")
df = pd.read_csv(CSV_PATH)

print("2. MySQL 연결 중...")
conn = pymysql.connect(host=MYSQL_HOST, port=MYSQL_PORT, user=MYSQL_USER, password=MYSQL_PASSWORD, database=MYSQL_DB)
cursor = conn.cursor()

count = 0
for idx, row in df.iterrows():
    link = str(row.get('링크', ''))
    match = re.search(r'GI_Read/(\d+)', link)
    if match:
        origin_id = match.group(1)
        location = row.get('지역', '')
        contract = row.get('고용형태', '')

        loc_val = None if pd.isna(location) else str(location)
        ctr_val = None if pd.isna(contract) else str(contract)

        if loc_val or ctr_val:
            cursor.execute('UPDATE job_posting SET location = %s, contract_type = %s WHERE origin_job_id = %s', (loc_val, ctr_val, origin_id))
            count += 1
            if count % 1000 == 0:
                conn.commit()
                print(f"{count} 건 적용 완료...")

conn.commit()
print(f"✅ 총 {count} 개의 공고에 지역/고용형태 데이터 정상 반영 완료!")
cursor.close()
conn.close()
