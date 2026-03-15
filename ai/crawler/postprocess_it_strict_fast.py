# -*- coding: utf-8 -*-
import pandas as pd
import json
import os
import time
import threading
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

MODEL = "gpt-4o-mini"
MAX_CONTENT = 3500
BATCH_SIZE = 10
MAX_WORKERS = 5  # 병렬 처리 스레드 개수 (5배 빠름)
INPUT_FILE = 'jobkorea_jobs_all.csv'
CHECKPOINT_FILE = 'jobkorea_jobs_it_strict_checkpoint.csv'
OUTPUT_FILE = 'jobkorea_jobs_processed_it_strict.csv'

# 스레드 안전성을 위한 락 생성
lock = threading.Lock()

SYSTEM_PROMPT = """\
당신은 IT/개발자 채용 공고 데이터를 파싱하는 매우 엄격한 데이터 엔지니어입니다.
주어진 채용 공고 원문(OCR 텍스트)에서 **오직 "IT, 전산관리, 개발, 시스템 엔지니어, 데이터 분석" 등 IT 핵심 직무와 관련된 내용만** 추출하십시오.

[절대 지켜야 할 원칙]
1. 종합 채용 공고(영업, 재무, 제조, IT 등 혼합)인 경우, 오직 IT 관련 부문의 주요업무, 자격요건, 우대사항만 찾아내세요.
2. 절대 내용을 요약하거나 임의로 단어를 통합하지 마십시오. (원문 텍스트 그대로 배열에 담으세요)
3. 100% IT 공고라면 IT 내용을 모두 빠짐없이 찾아 분리하세요.
4. 비-IT 내용(제조공정, 세무재무, 인사, 서비스기획 등 단순 사무/영업/생산직)은 철저하게 무시하세요.
5. '기술스택'은 공고에 명시된 프로그래밍 언어, 프레임워크, DB, 인프라 등만 추출하세요.

반드시 아래 JSON 형식의 "배열(List)"로만 응답하세요.
[
  {
    "Job_ID": "입력받은 ID",
    "주요업무": ["원문 내용 1", "원문 내용 2"],
    "자격요건": ["원문 내용 1"],
    "우대사항": ["원문 내용 1"],
    "기술스택": ["Java", "Oracle"]
  }
]
"""

def process_batch(batch_df):
    prompt_items = []
    
    for idx, row in batch_df.iterrows():
        job_id = str(row['링크']).split('/')[-1] if pd.notna(row['링크']) else str(idx)
        content = str(row.get('포지션상세', ''))[:MAX_CONTENT]
        if not content.strip() or content == 'nan':
            continue
        prompt_items.append(f"==== Job_ID: {job_id} ====\n{content}")
        
    if not prompt_items:
        return []

    user_msg = "\n\n".join(prompt_items)
    
    for attempt in range(4):
        try:
            resp = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg}
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
            )
            raw_text = resp.choices[0].message.content.strip()
            parsed = json.loads(raw_text)
            
            if isinstance(parsed, dict):
                for k, v in parsed.items():
                    if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict) and "Job_ID" in v[0]:
                        return v
                if "Job_ID" in parsed:
                    return [parsed]
            elif isinstance(parsed, list):
                valid_items = [x for x in parsed if isinstance(x, dict) and "Job_ID" in x]
                if valid_items:
                    return valid_items
        except Exception as e:
            time.sleep(2)
    return []

def main():
    print("Read: " + INPUT_FILE)
    df = pd.read_csv(INPUT_FILE, encoding='utf-8-sig', dtype=str)
    df['Job_ID'] = df['링크'].apply(lambda x: str(x).split('/')[-1] if pd.notna(x) else '')
    
    processed_ids = set()
    results_list = []
    
    if os.path.exists(CHECKPOINT_FILE):
        try:
            chk_df = pd.read_csv(CHECKPOINT_FILE, encoding='utf-8-sig', dtype=str)
            if 'Job_ID' in chk_df.columns:
                processed_ids = set(chk_df['Job_ID'].dropna().tolist())
                results_list = chk_df.to_dict('records')
                print(f"Resume... skip: {len(processed_ids)}")
        except Exception:
            pass
    
    df_to_process = df[~df['Job_ID'].isin(processed_ids)]
    print(f"Remain: {len(df_to_process)}")
    
    batches = [df_to_process.iloc[i:i+BATCH_SIZE] for i in range(0, len(df_to_process), BATCH_SIZE)]
    if not batches:
        print("Done!")
        return

    print(f"Speed: {MAX_WORKERS} Threads Running...")

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(process_batch, batch): batch for batch in batches}
        
        for i, future in enumerate(tqdm(as_completed(futures), total=len(futures), desc="진행률")):
            batch_result = future.result()
            
            if batch_result:
                new_items = []
                for item in batch_result:
                    if not isinstance(item, dict):
                        continue
                    jid = item.get("Job_ID", "")
                    if not jid:
                        continue
                    
                    orig_row = df[df['Job_ID'] == str(jid)]
                    if not orig_row.empty:
                        orig_dict = orig_row.iloc[0].to_dict()
                        orig_dict['주요업무'] = json.dumps(item.get('주요업무', []), ensure_ascii=False)
                        orig_dict['자격요건'] = json.dumps(item.get('자격요건', []), ensure_ascii=False)
                        orig_dict['우대사항'] = json.dumps(item.get('우대사항', []), ensure_ascii=False)
                        orig_dict['gpt_기술스택'] = json.dumps(item.get('기술스택', []), ensure_ascii=False)
                        new_items.append(orig_dict)
                
                with lock:
                    results_list.extend(new_items)
            
            # Save checkpoint safely
            if (i+1) % 10 == 0:
                with lock:
                    tmp_df = pd.DataFrame(results_list)
                    tmp_df.to_csv(CHECKPOINT_FILE, index=False, encoding='utf-8-sig')

    if results_list:
        with lock:
            pd.DataFrame(results_list).to_csv(OUTPUT_FILE, index=False, encoding='utf-8-sig')
    print("Success!!!")

if __name__ == "__main__":
    main()
