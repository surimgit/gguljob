# -*- coding: utf-8 -*-
import pandas as pd
import json
import os
import time
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from tqdm.asyncio import tqdm
from openai import AsyncOpenAI

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

MODEL = "gpt-4o-mini"
MAX_CONTENT = 4000
BATCH_SIZE = 1        # 완벽한 1:1 보장
MAX_CONCURRENT_REQUESTS = 30  # 속도업

INPUT_FILE = 'jobkorea_jobs_all.csv'
CHECKPOINT_FILE = 'jobkorea_jobs_it_strict_checkpoint.csv'
OUTPUT_FILE = 'jobkorea_jobs_processed_it_strict.csv'

SYSTEM_PROMPT = """\
당신은 IT/개발자 채용 공고 데이터를 파싱하는 매우 엄격한 데이터 엔지니어입니다.
주어진 채용 공고 원문(OCR 텍스트)에서 **오직 "IT, 전산관리, 개발, 시스템 엔지니어, 데이터 분석" 등 IT 관련 내용만** 추출하십시오.

[절대 지켜야 할 원칙]
1. 종합 공고인 경우, 오직 IT 부문의 주요업무, 자격요건, 우대사항만 찾아내세요.
2. 100% IT 공고라면 내용을 모두 반영하세요.
3. 절대 내용을 요약하거나 임의로 단어를 통합하지 마십시오. 원문 텍스트를 그대로 유지하세요.
4. 비-IT 내용은 무시하세요.

반드시 아래 JSON 형식의 "배열(List)"로 응답하세요. 만약 내용 전체가 영업/무역 등 철저히 비-IT 공고라면 어떤 항목이든 빈 배열을 반환해도 좋습니다. 단, 데이터는 무조건 1개의 요소로 채워서 반환하세요.
[
  {
    "Job_ID": "입력받은 ID",
    "주요업무": ["내용"],
    "자격요건": ["내용"],
    "우대사항": ["내용"],
    "기술스택": ["Java"]
  }
]
"""


async def process_batch(batch_df, sem):
    row = batch_df.iloc[0]
    job_id = str(row['링크']).split(
        '/')[-1] if pd.notna(row['링크']) else str(row.name)
    content = str(row.get('포지션상세', ''))[:MAX_CONTENT]

    if not content.strip() or content == 'nan':
        return [{"Job_ID": job_id, "주요업무": [], "자격요건": [], "우대사항": [], "기술스택": []}]

    user_msg = f"==== Job_ID: {job_id} ====\n{content}"

    async with sem:
        for attempt in range(15):
            try:
                resp = await client.chat.completions.create(
                    model=MODEL,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_msg}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.0,
                    timeout=30.0
                )
                raw_text = resp.choices[0].message.content.strip()
                parsed = json.loads(raw_text)

                if isinstance(parsed, dict) and "Job_ID" in parsed:
                    return [parsed]
                elif isinstance(parsed, dict):
                    for k, v in parsed.items():
                        if isinstance(v, list) and len(v) > 0 and isinstance(v[0], dict) and "Job_ID" in v[0]:
                            return v
                elif isinstance(parsed, list):
                    valid_items = [x for x in parsed if isinstance(
                        x, dict) and "Job_ID" in x]
                    if valid_items:
                        return valid_items

                return [{"Job_ID": job_id, "주요업무": [], "자격요건": [], "우대사항": [], "기술스택": []}]

            except Exception as e:
                err = str(e).lower()
                if '429' in err or 'rate limit' in err or 'insufficient_quota' in err:
                    await asyncio.sleep(5)
                else:
                    await asyncio.sleep(2)

        return [{"Job_ID": job_id, "주요업무": [], "자격요건": [], "우대사항": [], "기술스택": []}]


async def main():
    print("Read: " + INPUT_FILE)
    df = pd.read_csv(INPUT_FILE, encoding='utf-8-sig', dtype=str)
    df['Job_ID'] = df['링크'].apply(lambda x: str(
        x).split('/')[-1] if pd.notna(x) else '')

    processed_ids = set()
    results_list = []

    if os.path.exists(CHECKPOINT_FILE):
        try:
            chk_df = pd.read_csv(
                CHECKPOINT_FILE, encoding='utf-8-sig', dtype=str)
            if 'Job_ID' in chk_df.columns:
                processed_ids = set(chk_df['Job_ID'].dropna().tolist())
                results_list = chk_df.to_dict('records')
                print(f"Resume... skip: {len(processed_ids)}")
        except Exception:
            pass

    df_to_process = df[~df['Job_ID'].isin(processed_ids)]
    print(f"Remain: {len(df_to_process)}")

    batches = [df_to_process.iloc[i:i+BATCH_SIZE]
               for i in range(0, len(df_to_process), BATCH_SIZE)]
    if not batches:
        print("Done!")
        df_curr = pd.DataFrame(results_list)
        df_curr.to_csv(OUTPUT_FILE, index=False, encoding='utf-8-sig')
        return

    print(f"Perfect Extraction Mode (Batch={BATCH_SIZE}) Running...")

    sem = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    tasks = [process_batch(b, sem) for b in batches]

    for i, future in enumerate(await tqdm.gather(*tasks, desc="진행률")):
        batch_result = future
        if batch_result:
            for item in batch_result:
                if not isinstance(item, dict):
                    continue
                jid = item.get("Job_ID", "")
                if not jid:
                    continue

                orig_row = df[df['Job_ID'] == str(jid)]
                if not orig_row.empty:
                    orig_dict = orig_row.iloc[0].to_dict()
                    orig_dict['주요업무'] = json.dumps(
                        item.get('주요업무', []), ensure_ascii=False)
                    orig_dict['자격요건'] = json.dumps(
                        item.get('자격요건', []), ensure_ascii=False)
                    orig_dict['우대사항'] = json.dumps(
                        item.get('우대사항', []), ensure_ascii=False)
                    orig_dict['gpt_기술스택'] = json.dumps(
                        item.get('기술스택', []), ensure_ascii=False)
                    results_list.append(orig_dict)

        # 1:1매칭이므로 50건 마다 세이브
        if (i+1) % 50 == 0:
            df_curr = pd.DataFrame(results_list)
            df_curr.to_csv(CHECKPOINT_FILE, index=False, encoding='utf-8-sig')

    df_curr = pd.DataFrame(results_list)
    df_curr.to_csv(OUTPUT_FILE, index=False, encoding='utf-8-sig')
    df_curr.to_csv(CHECKPOINT_FILE, index=False, encoding='utf-8-sig')
    print("Success!!!")

if __name__ == '__main__':
    asyncio.run(main())
