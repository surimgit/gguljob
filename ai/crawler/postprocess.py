"""
postprocess.py

CSV 후처리 파이프라인:
  잡코리아 공고 포지션상세(OCR 텍스트)에서
  GPT-4o-mini → 주요업무/자격요건/우대사항 분리 + 기술스택 JSON 추출
  ThreadPoolExecutor 병렬 처리 (8000건 기준 약 10~15분)

실행:
  pip install openai pandas
  python postprocess.py --input jobkorea_jobs_all.csv --output jobkorea_jobs_processed.csv
"""

import argparse
import json
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI

# 프로젝트 루트의 .env 로드
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

# ── 설정 ──────────────────────────────────────────────────
MODEL = "gpt-4o-mini"
MAX_WORKERS = 10    # 동시 요청 수
MAX_CONTENT = 4000  # 입력 문자 제한

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# 기술스택 노이즈 패턴
_SKILL_NOISE = re.compile(
    r'토익|토플|TOEIC|TOEFL|TEPS|텝스|OPIc|오픽|JLPT|HSK|'
    r'정보처리기사|기사$|산업기사|기능사|운전면허|어학|영어점수|'
    r'영어회화|회화$|비즈니스영어|'
    r'^영어$|^중국어$|^일본어$|^한국어$|^러시아어$|^스페인어$|^독일어$|^프랑스어$|'
    r'^Excel$|^PowerPoint$|^Word$|^OA$|^PPT$|^MS Office$|Microsoft Office|'
    r'^한글$|^HWP$|아래아한글|^한컴$|'
    r'자격$|면허$|'
    r'^IFRS|^K-IFRS|^GAAP|^IATF|^ASPICE|^ISO[\s_-]?\d|'
    r'^CPA$|^CFA$|^CISA$|^CISSP$|^AICPA|^OPIC$|^TOEIC$|^TOEFL$',
    re.IGNORECASE,
)

_PLACEHOLDER_SKILLS = {"Python", "Django", "PostgreSQL"}

SYSTEM_PROMPT = """\
채용 공고 원문을 구조화하는 어시스턴트다.
반드시 아래 JSON 형식으로만 응답하라. 다른 텍스트는 절대 출력하지 마라.

{"주요업무": [...], "자격요건": [...], "우대사항": [...], "기술스택": [...]}

규칙:
- 주요업무·자격요건·우대사항: 항목당 하나씩 간결한 한국어 구/문장 리스트
- 기술스택: 오직 프로그래밍 언어·프레임워크·라이브러리·DB·클라우드·개발도구·플랫폼만 포함
  절대 포함하지 말 것: 자격증(CPA·CFA·CISA·약사면허·정보처리기사 등), 어학(영어·토익·TOEIC·영어회화 등),
  회계·공정 표준(IFRS·ASPICE·IATF·ISO 등), 오피스(Excel·Word·PPT·한글·HWP 등),
  운전면허, 전공명, 비기술 업무 역량
  공고에 기술스택이 없으면 반드시 빈 배열 []
- 내용 없는 항목은 빈 배열 []"""


# ── API 호출 ──────────────────────────────────────────────
def extract_from_text(content: str) -> dict | None:
    if not content or not content.strip():
        return None
    try:
        resp = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": content[:MAX_CONTENT]},
            ],
            response_format={"type": "json_object"},
            temperature=0,
            max_tokens=1024,
        )
        return json.loads(resp.choices[0].message.content)
    except Exception as e:
        print(f"  [API 오류] {e}")
        return None


# ── 단일 행 처리 ──────────────────────────────────────────
def process_row(args: tuple) -> tuple:
    idx, row = args
    content = str(row.get("포지션상세", ""))
    extracted = extract_from_text(content)

    row_dict = dict(row)
    if not extracted:
        return idx, row_dict

    # 기술스택: RSC 원본 있으면 노이즈만 제거, 없으면 LLM 값 사용
    try:
        rsc_skills: list = json.loads(str(row.get("기술스택", "[]") or "[]"))
    except Exception:
        rsc_skills = []
    llm_skills: list = extracted.get("기술스택", [])
    if not isinstance(llm_skills, list):
        llm_skills = []

    seen: set = set()
    clean_rsc: list = []
    for s in rsc_skills:
        if not isinstance(s, str) or not s.strip():
            continue
        s = s.strip()
        if _SKILL_NOISE.search(s):
            continue
        if s not in seen:
            seen.add(s)
            clean_rsc.append(s)

    if clean_rsc:
        merged = clean_rsc
    else:
        merged = []
        for s in llm_skills:
            if not isinstance(s, str) or not s.strip():
                continue
            s = s.strip()
            if _SKILL_NOISE.search(s) or s in _PLACEHOLDER_SKILLS:
                continue
            if s not in seen:
                seen.add(s)
                merged.append(s)

    row_dict["기술스택"] = json.dumps(merged, ensure_ascii=False)

    for field in ("주요업무", "자격요건", "우대사항"):
        val = extracted.get(field, [])
        if isinstance(val, list):
            cleaned = [s.strip()
                       for s in val if isinstance(s, str) and s.strip()]
            row_dict[field] = json.dumps(cleaned, ensure_ascii=False)
        elif isinstance(val, str) and val.strip():
            row_dict[field] = val.strip()

    return idx, row_dict


# ── 메인 ─────────────────────────────────────────────────
def run(input_csv: str, output_csv: str, limit: int | None = None):
    df = pd.read_csv(input_csv, encoding="utf-8-sig")
    if limit:
        df = df.head(limit)

    rows = df.to_dict("records")
    total = len(rows)
    results = [None] * total

    print(f"총 {total}건 처리 시작 (workers={MAX_WORKERS}, model={MODEL})")

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_idx = {
            executor.submit(process_row, (i, row)): i
            for i, row in enumerate(rows)
        }
        done = 0
        for future in as_completed(future_to_idx):
            try:
                idx, result = future.result()
                results[idx] = result
            except Exception as e:
                idx = future_to_idx[future]
                print(f"  [행 처리 오류 idx={idx}] {e}")
                results[idx] = rows[idx]
            done += 1
            if done % 100 == 0 or done == total:
                print(f"  {done}/{total} 완료")

    out_df = pd.DataFrame(results)
    out_df.to_csv(output_csv, index=False, encoding="utf-8-sig")
    print(f"\n완료: {output_csv} ({len(out_df)}행)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="jobkorea_jobs_all.csv")
    parser.add_argument("--output", default="jobkorea_jobs_processed.csv")
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()
    run(args.input, args.output, args.limit)
