import re
import time

import requests
from bs4 import BeautifulSoup
import pandas as pd


# ── 목록 API ──────────────────────────────────────────────
URL = "https://www.wanted.co.kr/api/chaos/navigation/v1/results"
# ── 상세 API (job_id 치환) ────────────────────────────────
DETAIL_URL = "https://www.wanted.co.kr/api/chaos/jobs/v4/{job_id}/details"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.wanted.co.kr/",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "ko-KR,ko;q=0.9",
}

# job_group_id: 518 = 개발 전체
# job_sort: job.popularity_order(인기순), job.latest_order(최신순)
PARAMS = {
    "job_group_id": "518",
    "country": "kr",
    "job_sort": "job.popularity_order",
    "locations": "all",
    "limit": 100,   # 한 번에 최대 요청
    "offset": 0,
}


def _parse_experience(exp: dict) -> str:
    exp_min = exp.get("min")
    exp_max = exp.get("max")
    if exp_min == 0 and exp_max == 0:
        return "신입"
    if exp_min is not None and exp_max is not None:
        return f"{exp_min}~{exp_max}년"
    return "경력무관"


def _clean(text: str | None) -> str | None:
    """엑셀에서 허용하지 않는 제어문자를 제거한다."""
    if text is None:
        return None
    # ASCII 제어문자 제거 (탭·줄바꿈 제외)
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)


# ── STEP 1: 목록 전체 수집 (페이지네이션) ────────────────
def get_job_list() -> list[dict]:
    """목록 API를 offset으로 순회하며 전체 공고를 수집한다."""
    print("[1단계] 공고 목록 전체 수집 중...")

    result = []
    offset = 0
    page = 1

    while True:
        params = {**PARAMS, "offset": offset}
        try:
            response = requests.get(
                URL, params=params, headers=HEADERS, timeout=10)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"목록 요청 오류 (offset={offset}): {e}")
            break

        jobs = response.json().get("data", [])
        if not jobs:
            break  # 더 이상 데이터 없음

        for job in jobs:
            company = job.get("company", {})
            job_id = job.get("id")
            result.append({
                "job_id": job_id,
                "회사명": company.get("name", ""),
                "공고명": job.get("position", ""),
                "경력": _parse_experience(job.get("experience_level", {})),
                "마감일": job.get("due_time") or "상시",
                "링크": f"https://www.wanted.co.kr/wd/{job_id}" if job_id else "",
            })

        print(f"  페이지 {page:03d} → 누적 {len(result)}개")
        offset += PARAMS["limit"]
        page += 1
        time.sleep(0.5)  # 목록 요청 간 딜레이

    print(f"  → 총 {len(result)}개 공고 목록 수집 완료")
    return result


# ── STEP 2: 상세 수집 ─────────────────────────────────────
RETRY_COUNT = 3
RETRY_WAIT = 10  # Rate Limit 감지 시 대기 초


def get_job_detail(job_id: int) -> dict:
    """
    상세 API 호출. 429(Rate Limit) 시 대기 후 재시도.
    실패 시 HTML <span> 폴백, 그것도 실패하면 None 반환.
    """
    empty = {"포지션상세": None, "주요업무": None, "자격요건": None, "우대사항": None}

    # 2-1. 상세 API 시도 (재시도 포함)
    for attempt in range(1, RETRY_COUNT + 1):
        try:
            api_url = DETAIL_URL.format(job_id=job_id)
            resp = requests.get(api_url, headers=HEADERS, timeout=10)

            if resp.status_code == 429:
                print(
                    f"    ⏳ Rate Limit (id={job_id}), {RETRY_WAIT}초 대기 후 재시도... ({attempt}/{RETRY_COUNT})")
                time.sleep(RETRY_WAIT)
                continue

            resp.raise_for_status()
            detail_data = resp.json().get("data", {}).get("job", {}).get("detail", {})

            return {
                "포지션상세": _clean(detail_data.get("intro")),
                "주요업무":   _clean(detail_data.get("main_tasks")),
                "자격요건":   _clean(detail_data.get("requirements")),
                "우대사항":   _clean(detail_data.get("preferred_points")),
            }
        except requests.exceptions.RequestException:
            time.sleep(3)

    # 2-2. HTML <span> 폴백
    try:
        page_url = f"https://www.wanted.co.kr/wd/{job_id}"
        resp = requests.get(page_url, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        spans = soup.select("section span")
        text = "\n".join(s.get_text(strip=True)
                         for s in spans if s.get_text(strip=True))
        return {
            "포지션상세": None,
            "주요업무":   _clean(text) if text else None,
            "자격요건":   None,
            "우대사항":   None,
        }
    except Exception as e:
        print(f"    ⚠ 상세 파싱 실패 (id={job_id}): {e}")
        return empty


# ── 메인 ──────────────────────────────────────────────────
CHECKPOINT_FILE = "wanted_dev_jobs_checkpoint.csv"
EXCEL_FILE = "wanted_dev_jobs_all.xlsx"


def crawl_all_wanted_jobs():
    # 기존 체크포인트 로드 (중단된 경우 이어서 수집)
    if pd.io.common.file_exists(CHECKPOINT_FILE):
        existing_df = pd.read_csv(CHECKPOINT_FILE, encoding="utf-8-sig")
        done_ids = set(existing_df["job_id"].dropna().astype(int).tolist())
        print(f"[체크포인트] 기존 수집 데이터 {len(done_ids)}개 로드 → 이후부터 이어서 수집")
    else:
        existing_df = pd.DataFrame()
        done_ids = set()

    jobs = get_job_list()
    if not jobs:
        return

    # 아직 수집 안 된 것만 필터
    remaining = [j for j in jobs if j["job_id"] not in done_ids]
    total = len(remaining)
    print(f"\n[2단계] 상세 내용 수집 중... (신규 {total}개, 요청 간 1초 딜레이)")

    new_rows = []
    for i, job in enumerate(remaining, 1):
        job_id = job["job_id"]
        detail = get_job_detail(job_id)
        row = {**job, **detail}
        new_rows.append(row)
        print(f"  [{i:04d}/{total}] {job['회사명']} - {job['공고명']}")

        # 50개마다 체크포인트 저장
        if i % 50 == 0:
            _save_checkpoint(existing_df, new_rows)
            print(f"  💾 체크포인트 저장 ({len(done_ids) + i}개)")

        time.sleep(1)

    # 최종 저장
    _save_checkpoint(existing_df, new_rows)
    final_df = pd.read_csv(CHECKPOINT_FILE, encoding="utf-8-sig")
    final_df.drop(columns=["job_id"], errors="ignore").to_excel(
        EXCEL_FILE, index=False)

    missing = final_df.isnull().sum()
    if missing.any():
        print(f"\n[결측치 현황]\n{missing[missing > 0].to_string()}")
    print(f"\n총 {len(final_df)}개의 공고 → '{EXCEL_FILE}' 저장 완료")


def _save_checkpoint(existing_df: pd.DataFrame, new_rows: list):
    """기존 데이터 + 신규 데이터를 CSV에 저장한다."""
    new_df = pd.DataFrame(new_rows)
    merged = pd.concat([existing_df, new_df], ignore_index=True)
    merged.to_csv(CHECKPOINT_FILE, index=False, encoding="utf-8-sig")


if __name__ == "__main__":
    crawl_all_wanted_jobs()
