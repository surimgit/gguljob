"""
catfix_gpt.py

직무카테고리가 비어있는 공고를 GPT-4o-mini로 분류한다.
공고명을 20건씩 배치로 보내 분당 토큰 사용량을 최소화한다.

실행:
  python catfix_gpt.py --input jobkorea_jobs_processed_catfix.csv \
                       --output jobkorea_jobs_processed_catfix2.csv
"""

import argparse
import json
import os
import time
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI

# ── 설정 ─────────────────────────────────────────────────
BATCH_SIZE = 20       # 요청당 공고 수
REQUEST_INTERVAL = 1.5  # 요청 간격(초)
MODEL = "gpt-4o-mini"

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

CATEGORIES = [
    "백엔드개발자", "프론트엔드개발자", "웹개발자", "앱개발자",
    "시스템엔지니어", "네트워크엔지니어", "DBA", "데이터엔지니어",
    "데이터사이언티스트", "보안엔지니어", "소프트웨어개발자", "게임개발자",
    "AI/ML엔지니어", "클라우드엔지니어", "IT컨설팅", "AI/ML연구원", "AI서비스개발자",
]

CAT_LIST = "\n".join(f"- {c}" for c in CATEGORIES)

SYSTEM_PROMPT = f"""채용 공고명을 보고 아래 직무 카테고리 중 1~3개를 골라라.
반드시 JSON 배열로만 응답하라: {{"results": [{{"idx": 0, "categories": ["카테고리1"]}}, ...]}}

직무 카테고리 목록 (이 중에서만 선택):
{CAT_LIST}

규칙:
- IT/개발 직무가 아니면 categories를 빈 배열 []로 반환
- 공고명에 직무가 명확히 드러나면 가장 잘 맞는 것만 선택
- 복수 직무 포함 공고(예: 웹개발+앱개발)는 최대 3개까지 허용
"""


def classify_batch(rows: list[dict]) -> list[list[str]]:
    """rows: [{idx, title}] → 각 idx 순서대로 categories 리스트 반환"""
    payload = json.dumps([{"idx": i, "title": r["title"]} for i, r in enumerate(rows)],
                         ensure_ascii=False)
    for attempt in range(6):
        try:
            time.sleep(REQUEST_INTERVAL)
            resp = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": payload},
                ],
                response_format={"type": "json_object"},
                temperature=0,
                max_tokens=512,
                timeout=30,
            )
            data = json.loads(resp.choices[0].message.content)
            results = data.get("results", [])
            # idx 순서로 정렬 후 반환
            results.sort(key=lambda x: x.get("idx", 0))
            return [r.get("categories", []) for r in results]
        except Exception as e:
            err = str(e)
            if "429" in err or "rate_limit" in err:
                wait = 2 ** attempt
                print(f"  [429 재시도 {attempt+1}/6] {wait}초 대기...")
                time.sleep(wait)
            else:
                print(f"  [오류] {e}")
                return [[] for _ in rows]
    return [[] for _ in rows]


def run(input_csv: str, output_csv: str):
    df = pd.read_csv(input_csv, encoding="utf-8-sig")
    blank_mask = df["직무카테고리"].fillna("").astype(str).str.strip().eq("")
    target_idx = df.index[blank_mask].tolist()
    total = len(target_idx)

    # 이어하기: 이미 output_csv가 있으면 거기서 카테고리 채워진 것 로드
    checkpoint = Path(output_csv).with_suffix(".ckpt.csv")
    already_done: set[int] = set()
    if checkpoint.exists():
        ck_df = pd.read_csv(checkpoint, encoding="utf-8-sig")
        if "_orig_idx" in ck_df.columns:
            for _, row in ck_df.iterrows():
                oi = int(row["_orig_idx"])
                df.at[oi, "직무카테고리"] = row["직무카테고리"]
                already_done.add(oi)
            print(f"체크포인트 로드: {len(already_done)}건 이미 완료")

    remaining_idx = [i for i in target_idx if i not in already_done]
    print(f"분류 대상: {total}건 중 {len(remaining_idx)}건 남음 (배치 크기={BATCH_SIZE})")

    ck_rows: list[dict] = []
    filled = 0

    def save_checkpoint():
        ck_df_out = pd.DataFrame(ck_rows)
        ck_df_out.to_csv(checkpoint, index=False, encoding="utf-8-sig")

    for batch_start in range(0, len(remaining_idx), BATCH_SIZE):
        batch_idx = remaining_idx[batch_start: batch_start + BATCH_SIZE]
        rows = [{"title": str(df.at[i, "공고명"])} for i in batch_idx]
        cats_list = classify_batch(rows)

        for df_idx, cats in zip(batch_idx, cats_list):
            val = "·".join(cats) if cats else ""
            if val:
                df.at[df_idx, "직무카테고리"] = val
                filled += 1
            ck_rows.append({"_orig_idx": df_idx, "직무카테고리": val})

        done = batch_start + len(batch_idx)
        if done % 200 == 0 or done == len(remaining_idx):
            save_checkpoint()
            print(f"  진행 {done}/{len(remaining_idx)} | 채움 {filled}")

    remaining = df["직무카테고리"].fillna("").astype(str).str.strip().eq("").sum()
    print(
        f"\n완료: 채움 {filled}건, 잔여 빈값 {remaining}건 ({remaining/len(df)*100:.2f}%)")
    df.to_csv(output_csv, index=False, encoding="utf-8-sig")
    print(f"저장: {output_csv}")
    if checkpoint.exists():
        checkpoint.unlink()
        print("체크포인트 삭제 완료")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input", default="jobkorea_jobs_processed_catfix.csv")
    parser.add_argument(
        "--output", default="jobkorea_jobs_processed_catfix2.csv")
    args = parser.parse_args()
    run(args.input, args.output)
