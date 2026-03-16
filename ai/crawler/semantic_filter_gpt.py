import argparse
import ast
import json
import os
import time
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

BATCH_SIZE = 40
MODEL = "gpt-4o-mini"
CHECKPOINT_FILE = "jobkorea_jobs_semantic_checkpoint.csv"


def safe_eval(val):
    if pd.isna(val) or not str(val).startswith('['):
        return []
    try:
        return ast.literal_eval(val)
    except:
        return []


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input", default="jobkorea_jobs_processed_final_recovered_v4.csv")
    parser.add_argument(
        "--output", default="jobkorea_jobs_processed_final_semantic.csv")
    args = parser.parse_args()

    if os.path.exists(CHECKPOINT_FILE):
        print(f"체크포인트 {CHECKPOINT_FILE} 로드 중...")
        df = pd.read_csv(CHECKPOINT_FILE, encoding='utf-8-sig')
    else:
        df = pd.read_csv(args.input, encoding='utf-8-sig')
        if 'gpt_processed' not in df.columns:
            df['gpt_processed'] = False

    target_idx = df.index[~df['gpt_processed']].tolist()
    print(f"총 {len(df)}건 중 GPT 문맥 정제 대상: {len(target_idx)}건")

    if not target_idx:
        print("모든 정제 완료. 빈 데이터 필터링 후 저장합니다.")
        save_final(df, args.output)
        return

    sys_prompt = """당신은 IT/개발자 전문 채용 플랫폼의 데이터 정제 전문가입니다.
채용 공고의 '주요업무(tasks)', '자격요건(reqs)', '우대사항(prefs)' 배열을 입력받아,
오직 '순수 IT, 소프트웨어 개발, 데이터 사이언스/DB, 인프라(서버/네트워크), 정보보안' 업무와 관련된 항목만 남기고 반환하세요.

[필독 규칙]
1. '개발, 시스템, 분석, 모델링, 인프라' 라는 단어가 포함되었더라도, 문맥이 '금융(투자/대출) 인프라, 보험 계리 모델링, 영업/기획 시스템, 재무제표, 손해율, 상품개발, 경영분석' 등 IT 직무가 아니라면 반드시 배열에서 삭제하세요. 
2. '정보보안, IT시스템 관리, 데이터 사이언스 모델 구축, 웹/앱/서버/클라우드 개발 및 운영' 등 명백한 IT 직무에만 해당하는 문장만 남기세요.
3. 관련 내용이 하나도 없으면 요소를 텅 빈 배열([])로 두세요.
4. 응답은 반드시 주어진 JSON과 완전히 동일한 key("id", "tasks", "reqs", "prefs")를 가진 배열 형태로만 반환하세요."""

    from concurrent.futures import ThreadPoolExecutor, as_completed

    def process_batch(i, batch_indices):
        batch_data = []
        for idx in batch_indices:
            batch_data.append({
                "id": int(idx),
                "tasks": safe_eval(df.at[idx, '주요업무']),
                "reqs": safe_eval(df.at[idx, '자격요건']),
                "prefs": safe_eval(df.at[idx, '우대사항'])
            })

        user_content = json.dumps(batch_data, ensure_ascii=False)
        try:
            resp = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.0
            )

            res_text = resp.choices[0].message.content.strip()
            if res_text.startswith("```json"):
                res_text = res_text[7:-3].strip()
            elif res_text.startswith("```"):
                res_text = res_text[3:-3].strip()

            parsed = json.loads(res_text)
            return (i, parsed, None)
        except Exception as e:
            return (i, None, e)

    batches = [target_idx[j:j+BATCH_SIZE]
               for j in range(0, len(target_idx), BATCH_SIZE)]
    print(f"총 {len(batches)}개의 배치(Batch size: {BATCH_SIZE})를 병렬로 처리합니다.")

    processed_count = 0
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(process_batch, i, b): (i, b)
                   for i, b in enumerate(batches)}

        for future in as_completed(futures):
            i, b = futures[future]
            batch_idx, parsed, err = future.result()
            if err:
                print(f"[Error] 배치 {batch_idx} 실패: {err}")
                continue

            for item in parsed:
                row_idx = item.get("id")
                if row_idx is not None and row_idx in df.index:
                    df.at[row_idx, '주요업무'] = str(item.get("tasks", []))
                    df.at[row_idx, '자격요건'] = str(item.get("reqs", []))
                    df.at[row_idx, '우대사항'] = str(item.get("prefs", []))
                    df.at[row_idx, 'gpt_processed'] = True

            processed_count += len(b)
            print(f"진행: {processed_count} / {len(target_idx)}")

            df.to_csv(CHECKPOINT_FILE, index=False, encoding='utf-8-sig')

    save_final(df, args.output)


def save_final(df, out_path):
    final_df = df.copy()
    initial_len = len(final_df)

    # gpt_processed 제거
    if 'gpt_processed' in final_df.columns:
        final_df = final_df.drop(columns=['gpt_processed'])

    # 빈 배열 처리 (IT 업무가 하나도 없는 녀석들 삭제)
    final_df = final_df[final_df['주요업무'] != '[]']
    final_len = len(final_df)

    final_df.to_csv(out_path, index=False, encoding='utf-8-sig')
    print("="*40)
    print(f"모든 AI 문맥 정제 완료!")
    print(
        f"초기: {initial_len}건 -> 비-IT 공고 삭제: {initial_len - final_len}건 -> 최종: {final_len}건")
    print(f"저장된 파일: {out_path}")

    # 검증: 현대해상 찍어보기
    hyundai = final_df[final_df['회사명'].str.contains('현대해상', na=False)]
    if not hyundai.empty:
        print("\n👇 [검증] 현대해상 정제 결과 👇")
        print("주요업무: ", hyundai.iloc[0]['주요업무'])
    else:
        print("\n👇 [검증] 현대해상 정제 결과 👇")
        print("현대해상 공고는 순수 IT업무가 남아있지 않아 폐기되었습니다 (정상).")


if __name__ == "__main__":
    main()
