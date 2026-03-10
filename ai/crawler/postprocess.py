"""
postprocess.py

CSV 후처리 파이프라인:
  잡코리아 공고 포지션상세(OCR 텍스트 또는 HTML 본문)에서
  qwen2.5:7b → 주요업무/자격요건/우대사항 분리 + 기술스택/성향 JSON 추출

실행:
  ollama run qwen2.5:7b
  pip install ollama
  python postprocess.py --input jobkorea_jobs_all.csv --output jobkorea_jobs_processed.csv
"""

import argparse
import json
import os
import re
import time

import ollama
import pandas as pd

# ── 설정 ──────────────────────────────────────────────────
TEXT_MODEL = "qwen2.5:7b"

# 기술스택에서 제거할 노이즈 패턴 (어학/자격증/오피스/소프트스킬)
_SKILL_NOISE = re.compile(
    r'토익|토플|TOEIC|TOEFL|TEPS|텝스|OPIc|오픽|JLPT|HSK|'
    r'정보처리기사|기사$|산업기사|기능사|운전면허|어학|영어점수|'
    r'^영어$|^중국어$|^일본어$|비즈니스영어|'
    r'^Excel$|^PowerPoint$|^Word$|^OA$|^PPT$|^MS Office$|Microsoft Office|'
    r'^한글$|^HWP$|아래아한글',
    re.IGNORECASE,
)

# 프롬프트 예시 placeholder (LLM이 그대로 출력할 때 제거)
_PLACEHOLDER_SKILLS = {"Python", "Django", "PostgreSQL"}


# ── 프롬프트 ──────────────────────────────────────────────
TEXT_PROMPT = """\
아래는 채용 공고 원문이다. 내용을 구조화하여 JSON으로 출력하라.
설명 없이 JSON만 출력하라.

[규칙]
1. 주요업무·자격요건·우대사항: 항목당 하나씩 간결한 구/문장으로 리스트 작성
2. 기술스택: 프로그래밍 언어·프레임워크·라이브러리·DB·클라우드·개발도구·플랫폼만 포함
   - 반드시 실제 공고 내용 기반으로만 작성 (없으면 빈 리스트)
   - Excel/PowerPoint/Word/영어/운전면허/자격증명 절대 제외
3. 내용이 없는 항목은 빈 리스트 []

출력 형식 (이 형식 그대로, 키명 유지):
{{"주요업무": [...], "자격요건": [...], "우대사항": [...], "기술스택": [...]}}

--- 공고 원문 ---
{content}
"""


# ── 텍스트 모델 호출 ──────────────────────────────────────
def extract_from_text(content: str, 직무카테고리: str = "") -> dict | None:
    if not content or not content.strip():
        return None
    prompt = TEXT_PROMPT.format(content=content[:4000])
    try:
        resp = ollama.chat(
            model=TEXT_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        return _parse_json(resp.message.content)
    except Exception as e:
        print(f"  [텍스트 모델 오류] {e}")
        return None


# ── 비전 모델 호출 ────────────────────────────────────────
def extract_from_image(image_paths: list[str], 직무카테고리: str = "") -> dict | None:
    """현재 텍스트 전용 모델 사용 중 → OCR fallback 유도를 위해 None 반환."""
    return None


# ── JSON 파싱 헬퍼 ────────────────────────────────────────
def _parse_json(text: str) -> dict | None:
    # ```json ... ``` 코드블록 제거
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`").strip()
    try:
        return json.loads(text)
    except Exception:
        # 부분 매칭 fallback
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group())
            except Exception:
                pass
    return None


# ── 메인 ─────────────────────────────────────────────────
def run(input_csv: str, output_csv: str, limit: int | None = None):
    df = pd.read_csv(input_csv, encoding="utf-8-sig")
    if limit:
        df = df.head(limit)

    results = []
    total = len(df)

    for i, row in df.iterrows():
        title = str(row.get("공고명", ""))[:30]
        print(f"[{int(i)+1:04d}/{total}] {title}")

        내용형식 = str(row.get("내용형식", "text"))
        직무카테고리 = str(row.get("직무카테고리", ""))
        content = str(row.get("포지션상세", ""))

        if 내용형식 == "image":
            # 로컬 저장된 이미지 경로 → vision LLM, 실패 시 OCR 텍스트로 fallback
            try:
                paths: list = json.loads(
                    str(row.get("이미지_urls", "[]") or "[]"))
            except Exception:
                paths = []
            extracted = extract_from_image(paths, 직무카테고리)
            if extracted is None and content.strip():
                print("  ↳ vision 실패, OCR 텍스트로 대체")
                extracted = extract_from_text(content, 직무카테고리)
        else:
            extracted = extract_from_text(content, 직무카테고리)

        row_dict = row.to_dict()
        if extracted:
            # 기술스택 처리
            try:
                rsc_skills: list = json.loads(
                    str(row.get("기술스택", "[]") or "[]"))
            except Exception:
                rsc_skills = []
            llm_skills: list = extracted.get("기술스택", [])
            if not isinstance(llm_skills, list):
                llm_skills = []

            # 노이즈 제거한 RSC 기술스택
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
                # RSC에 유효한 값이 있으면 그대로 사용 (노이즈만 제거)
                merged = clean_rsc
            else:
                # RSC가 비어있으면 LLM 유추값 사용 (placeholder 예시값 제외)
                merged = []
                for s in llm_skills:
                    if not isinstance(s, str) or not s.strip():
                        continue
                    s = s.strip()
                    if _SKILL_NOISE.search(s):
                        continue
                    if s in _PLACEHOLDER_SKILLS:
                        continue
                    if s not in seen:
                        seen.add(s)
                        merged.append(s)
            row_dict["기술스택"] = json.dumps(merged, ensure_ascii=False)

            for field in ("주요업무", "자격요건", "우대사항"):
                llm_val = extracted.get(field, [])
                # 리스트이면 그대로 JSON으로 저장, 문자열이면 그대로
                if isinstance(llm_val, list):
                    cleaned = [s.strip()
                               for s in llm_val if isinstance(s, str) and s.strip()]
                    row_dict[field] = json.dumps(cleaned, ensure_ascii=False)
                elif isinstance(llm_val, str) and llm_val.strip():
                    row_dict[field] = llm_val.strip()

        results.append(row_dict)
        time.sleep(0.2)

    out_df = pd.DataFrame(results)
    out_df.to_csv(output_csv, index=False, encoding="utf-8-sig")
    print(f"\n완료: {output_csv} ({len(out_df)}행)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="jobkorea_jobs_all.csv")
    parser.add_argument("--output", default="jobkorea_jobs_processed.csv")
    parser.add_argument("--limit", type=int, default=None,
                        help="테스트용 처리 건수 제한")
    args = parser.parse_args()
    run(args.input, args.output, args.limit)
