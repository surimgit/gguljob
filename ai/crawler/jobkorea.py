import json
import re
import time

import requests
from bs4 import BeautifulSoup
import pandas as pd


# ── 설정 ──────────────────────────────────────────────────
# recruit/joblist?menucode=duty&duty=... 형식의 전통 HTML 페이지
SEARCH_URL = "https://www.jobkorea.co.kr/recruit/joblist"

# 수집 대상 IT/개발 직무 카테고리 코드
DUTY_CODES = [
    "1000229",  # 백엔드개발자
    "1000230",  # 프론트엔드개발자
    "1000231",  # 웹개발자
    "1000232",  # 앱개발자
    "1000233",  # 시스템엔지니어
    "1000234",  # 네트워크엔지니어
    "1000235",  # DBA
    "1000236",  # 데이터엔지니어
    "1000237",  # 데이터사이언티스트
    "1000238",  # 보안엔지니어
    "1000239",  # 소프트웨어개발자
    "1000240",  # 게임개발자
    "1000242",  # AI/ML엔지니어
    "1000244",  # 클라우드엔지니어
    "1000246",  # IT컨설팅
    "1000417",  # AI/ML연구원
    "1000423",  # AI서비스개발자
]

# DUTY_CODES subCode → 직무 카테고리 이름 매핑 (잡코리아 검색 필터 기준)
_DUTY_CODE_NAMES: dict[str, str] = {
    "1000229": "백엔드개발자",
    "1000230": "프론트엔드개발자",
    "1000231": "웹개발자",
    "1000232": "앱개발자",
    "1000233": "시스템엔지니어",
    "1000234": "네트워크엔지니어",
    "1000235": "DBA",
    "1000236": "데이터엔지니어",
    "1000237": "데이터사이언티스트",
    "1000238": "보안엔지니어",
    "1000239": "소프트웨어개발자",
    "1000240": "게임개발자",
    "1000242": "AI/ML엔지니어",
    "1000244": "클라우드엔지니어",
    "1000246": "IT컨설팅",
    "1000417": "AI/ML연구원",
    "1000423": "AI서비스개발자",
}

_EDUCATION_CODE_MAP: dict[str, str] = {
    "7000000010": "학력무관",
    "7000000020": "중졸이하",
    "7000000030": "고졸",
    "7000000040": "고졸이상",
    "7000000050": "초대졸이상",
    "7000000060": "대졸이상",
    "7000000070": "석사이상",
    "7000000080": "박사이상",
}

SEARCH_PARAMS = {
    "menucode": "duty",
    "duty": ",".join(DUTY_CODES),
}
DETAIL_BASE = "https://www.jobkorea.co.kr/Recruit/GI_Read/{job_id}?Oem_Code=C1"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.jobkorea.co.kr/",
    "Accept-Language": "ko-KR,ko;q=0.9",
}

CHECKPOINT_FILE = "jobkorea_jobs_checkpoint.csv"
OUTPUT_FILE = "jobkorea_jobs_all.csv"


# 잡코리아 일반 검색결과 목록 API (JavaScript로 동적 로드 되는 부분)
GI_LIST_API = "https://www.jobkorea.co.kr/Recruit/Home/_GI_List/"
GI_LIST_HEADERS = {
    **HEADERS,
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Accept": "text/html, */*; q=0.01",
    "Referer": SEARCH_URL + "?menucode=duty&duty=" + ",".join(DUTY_CODES),
}
_GI_LIST_PAGE_SIZE = 40


# ── STEP 1: 목록 수집 (_GI_List API 기반, 페이지당 40개 유기 검색결과) ────────────────
def get_job_list(session: requests.Session, max_jobs: int | None = None) -> list[dict]:
    """잡코리아 _GI_List API로 유기 검색결과 공고 목록을 수집한다 (페이지당 40개)."""
    print("[1단계] 잡코리아 공고 목록 수집 중...")

    # 세션 쿠키 초기화를 위해 목록 페이지 한 번 방문
    try:
        session.get(SEARCH_URL, params={**SEARCH_PARAMS, "Page": 1},
                    headers=HEADERS, timeout=15)
    except requests.exceptions.RequestException:
        pass

    result: list[dict] = []
    seen_ids: set[str] = set()
    total_pages: int | None = None
    page = 1

    while True:
        post_data = {
            "condition[duty]": ",".join(DUTY_CODES),
            "condition[menucode]": "duty",
            "condition[dutyCtgr]": 0,
            "page": page,
            "direct": 0,
            "order": 20,   # 추천순
            "pagesize": _GI_LIST_PAGE_SIZE,
            "tabindex": 0,
            "onePick": 0,
            "confirm": 0,
            "profile": 0,
        }
        try:
            resp = session.post(GI_LIST_API, data=post_data,
                                headers=GI_LIST_HEADERS, timeout=15)
            resp.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"목록 API 요청 오류 (page={page}): {e}")
            break

        soup = BeautifulSoup(resp.text, "html.parser")
        items = soup.find_all("tr", class_="devloopArea")

        # 전체 건수로 총 페이지 수 계산 (1페이지에서만)
        if total_pages is None:
            m = re.search(r'hdnGICnt[^>]*value="([\d,]+)"', resp.text)
            if m:
                total = int(m.group(1).replace(",", ""))
                total_pages = max(
                    1, (total + _GI_LIST_PAGE_SIZE - 1) // _GI_LIST_PAGE_SIZE)
            else:
                total_pages = 1

        new_count = 0
        for item in items:
            job = _normalize_list_item_html(item)
            if job and job["job_id"] not in seen_ids:
                seen_ids.add(job["job_id"])
                result.append(job)
                new_count += 1
                if max_jobs and len(result) >= max_jobs:
                    break

        page_display = f"{page}/{total_pages}" if total_pages else str(page)
        print(f"  페이지 {page_display} → 신규 {new_count}개, 누적 {len(result)}개")

        if max_jobs and len(result) >= max_jobs:
            break
        if new_count == 0:
            break
        if total_pages and page >= total_pages:
            break

        page += 1
        time.sleep(0.5)

    print(f"  → 총 {len(result)}개 공고 목록 수집 완료")
    return result[:max_jobs] if max_jobs else result


def _normalize_list_item_html(item) -> dict | None:
    """_GI_List API 응답의 tr.devloopArea 요소 → 저장용 딕셔너리.
    경력/지역은 get_job_detail에서 채운다.
    """
    # job_id: data-gno 속성 (가장 신뢰성 높음)
    job_id = item.get("data-gno", "").strip()
    if not job_id:
        info = item.get("data-info", "")
        job_id = info.split("|")[0].strip() if info else None
    if not job_id:
        return None

    # 회사명: td.tplCo > a.link
    회사명 = ""
    co_td = item.find("td", class_="tplCo")
    if co_td:
        a_tag = co_td.find("a", class_="link")
        if a_tag:
            회사명 = a_tag.get_text(strip=True)

    # 공고명: td.tplTit > div.titBx > strong > a
    공고명 = ""
    tit_td = item.find("td", class_="tplTit")
    if tit_td:
        tit_a = tit_td.find("strong") and tit_td.find("strong").find("a")
        if tit_a:
            공고명 = tit_a.get("title", "") or tit_a.get_text(strip=True)

    # 마감일: span.date.dotum  예: ~03/11(수)
    마감일_list: str | None = None
    date_span = item.find("span", class_="date")
    if date_span:
        마감일_list = date_span.get_text(strip=True)

    return {
        "job_id": job_id,
        "회사명": 회사명,
        "공고명": 공고명,
        "경력": "",       # get_job_detail에서 채움
        "지역": "",       # get_job_detail에서 채움
        "링크": f"https://www.jobkorea.co.kr/Recruit/GI_Read/{job_id}",
        "마감일_list": 마감일_list,
    }


# ── STEP 2: 상세 수집 ─────────────────────────────────────
RETRY_COUNT = 3
RETRY_WAIT = 10

# overview.employments[].employmentType 코드 매핑
_EMPLOYMENT_TYPE_MAP = {
    "PERMANENT": "정규직",
    "CONTRACT": "계약직",
    "TRAINEE": "인턴",
    "PART_TIME": "아르바이트",
    "DISPATCH": "파견직",
    "FREELANCER": "프리랜서",
    "OUTSOURCING": "도급",
}

# requirement.careers[].type 코드 매핑
_CAREER_DETAIL = {
    "EXPERIENCED": "경력",
    "NEW": "신입",
    "NEWBIE": "신입",          # 잡코리아 신입 코드
    "EXPERIENCED_OR_NEW": "신입·경력",
    "NEW_OR_EXPERIENCED": "신입·경력",
    "ANY": "경력무관",
    "REGARDLESS": "경력무관",
}

# workCondition.pay 포맷터
_PAY_TYPE_LABEL = {
    "ANNUAL_SALARY": "연봉",
    "MONTHLY_SALARY": "월급",
    "HOURLY_WAGE": "시급",
    "DAILY_WAGE": "일급",
    "COMPANY_POLICY": "회사내규",
    "NEGOTIABLE": "협의",
}
# 단위: ANNUAL/MONTHLY → 만원, HOURLY/DAILY → 원
_PAY_UNIT = {
    "ANNUAL_SALARY": "만원",
    "MONTHLY_SALARY": "만원",
    "HOURLY_WAGE": "원",
    "DAILY_WAGE": "원",
}


def _format_pay(pay: dict) -> str:
    if not pay:
        return ""
    pay_type = pay.get("payType", "")
    pay_range = pay.get("payRange") or {}
    label = _PAY_TYPE_LABEL.get(pay_type, "")
    unit = _PAY_UNIT.get(pay_type, "")

    if pay_type == "COMPANY_POLICY":
        return "회사내규"

    from_val = pay_range.get("from")
    to_val = pay_range.get("to")

    if from_val and to_val:
        return f"{label} {from_val:,}~{to_val:,}{unit}"
    elif from_val:
        return f"{label} {from_val:,}{unit} 이상"
    return label or ""


def _parse_rsc_stream(html: str) -> tuple[dict | None, dict, list]:
    """__next_f RSC 스트림에서 (base_data, t_chunks, hard_skills) 를 반환한다.

    - base_data  : jobhub 공고 JSON (jobHubId 포함 딕셔너리)
    - t_chunks   : {chunk_id: S3_presigned_url} — T타입 텍스트 블롭
    - hard_skills: HARD_SKILL 타입 기술스택 이름 목록
    """
    push_vals = re.findall(
        r'self\.__next_f\.push\((\[.*?\])\s*\)', html, re.DOTALL)
    full_stream = ""
    for raw in push_vals:
        try:
            data = json.loads(raw)
            if data[0] == 1:
                full_stream += data[1]
        except Exception:
            pass

    # T타입 청크: 길이 기반 시퀀셜 파서
    # RSC 형식: {id}:T{hex_len},{content}
    t_chunks: dict[str, str] = {}
    pos = 0
    while pos < len(full_stream):
        m = re.match(r'([0-9a-f]+):T([0-9a-f]+),', full_stream[pos:pos + 200])
        if m:
            cid = m.group(1)
            hexlen = int(m.group(2), 16)
            content_start = pos + m.end()
            t_chunks[cid] = full_stream[content_start: content_start + hexlen]
            pos = content_start + hexlen
            if pos < len(full_stream) and full_stream[pos] == '\n':
                pos += 1
        else:
            nl = full_stream.find('\n', pos)
            if nl < 0:
                break
            pos = nl + 1

    if not push_vals:
        return None, t_chunks, [], []

    # skills 이름 추출 (HARD_SKILL 타입만)
    hard_skills: list[str] = []
    sm = re.search(r'"skills":\[{"name":', full_stream)
    if sm:
        arr_start = sm.start() + len('"skills":')
        try:
            arr, _ = json.JSONDecoder().raw_decode(full_stream, arr_start)
            hard_skills = [
                s["name"] for s in arr
                if isinstance(s, dict) and s.get("skillTypeCode") == "HARD_SKILL" and s.get("name")
            ]
        except Exception:
            pass

    # base_data 직접 추출: full_stream 내 "base":{...} 블록을 찾아 raw_decode
    # RSC의 T-청크가 같은 줄에 있어 \n-split 방식으로는 추출 불가능하므로
    # 위치 기반 raw_decode를 사용한다.
    bm = re.search(r'"base":\{', full_stream)
    base_obj = None
    if bm:
        try:
            base_obj, _ = json.JSONDecoder().raw_decode(full_stream, bm.end() - 1)
            if not (isinstance(base_obj, dict) and "jobHubId" in base_obj):
                base_obj = None
        except Exception:
            base_obj = None

    # 직무 카테고리: code-name-partCode 구조에서 DUTY_CODES에 해당하는 partCode만 추출
    duty_set = set(DUTY_CODES)
    seen_parts: list[str] = []
    seen_set: set[str] = set()
    for part in re.findall(
        r'\{"code":"\d+","name":"[^"]+"[^}]*"partCode":"(\d+)"', full_stream
    ):
        if part in duty_set and part not in seen_set:
            seen_set.add(part)
            seen_parts.append(part)

    return base_obj, t_chunks, hard_skills, seen_parts


def _html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator="\n")


def _clean(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def get_job_detail(session: requests.Session, job_id: str) -> dict:
    """단일 공고 상세 페이지 RSC 스트림을 파싱해서 필드 딕셔너리를 반환한다."""
    empty = {
        "마감일": None, "내용형식": "text",
        "고용형태": "", "경력": "", "지역": "", "급여": "",
        "기술스택": "[]", "포지션상세": None, "직무카테고리": "", "학력": "",
    }
    url = DETAIL_BASE.format(job_id=job_id)

    for attempt in range(RETRY_COUNT):
        try:
            resp = session.get(url, headers=HEADERS, timeout=15)
            if resp.status_code == 404:
                return empty  # 만료/삭제된 공고 즉시 스킵
            if resp.status_code == 429:
                print(f"    ⏳ Rate Limit (id={job_id}), {RETRY_WAIT}초 대기...")
                time.sleep(RETRY_WAIT)
                continue
            resp.raise_for_status()
            break
        except requests.exceptions.RequestException as e:
            if attempt == RETRY_COUNT - 1:
                print(f"    ❌ 상세 요청 실패 (id={job_id}): {e}")
                return empty
            time.sleep(3)
    else:
        return empty

    base_data, t_chunks, hard_skills, duty_parts = _parse_rsc_stream(resp.text)
    if not base_data:
        return empty

    ocr_text: str | None = None
    description_html: str | None = None

    # 마감일
    recruitment = base_data.get("overview", {}).get("recruitment", {})
    if recruitment.get("alwaysHire"):
        result_deadline: str | None = "상시채용"
    else:
        end_at = recruitment.get("applicationEndAt", "")
        result_deadline = end_at[:10] if end_at else None

    # 고용형태
    employments = base_data.get("overview", {}).get("employments", [])
    고용형태_labels = []
    for emp in employments:
        et = emp.get("employmentType", "")
        label = _EMPLOYMENT_TYPE_MAP.get(et, et)
        if label and label not in 고용형태_labels:
            고용형태_labels.append(label)
    고용형태 = "·".join(고용형태_labels)

    # 경력
    careers = base_data.get("requirement", {}).get("careers", [])
    경력 = ""
    if careers:
        types = [c.get("type", "") for c in careers]
        labels = [_CAREER_DETAIL.get(t, "") for t in types]
        unique_labels = list(dict.fromkeys(lb for lb in labels if lb))  # 중복 제거
        if len(unique_labels) == 1:
            ct = types[0]
            cr = careers[0].get("range")
            if ct == "EXPERIENCED" and cr and isinstance(cr, dict):
                from_yr = cr.get("from")
                경력 = f"경력 {from_yr}년 이상" if from_yr else "경력"
            else:
                경력 = unique_labels[0]
        elif len(unique_labels) >= 2:
            has_new = any("신입" in lb for lb in unique_labels)
            has_exp = any(
                "경력" in lb and "무관" not in lb for lb in unique_labels)
            경력 = "신입·경력" if has_new and has_exp else " / ".join(unique_labels)

    # 지역
    location_attrs = (
        base_data.get("workCondition", {})
        .get("workplace", {})
        .get("locationAttributes", [])
    )
    지역 = ""
    if location_attrs:
        loc = location_attrs[0]
        addr = loc.get("address", "") or loc.get("fullAddress", "")
        지역 = " ".join(addr.split()[:2]) if addr else ""

    # 급여
    pay_raw = base_data.get("workCondition", {}).get("pay", {})
    급여 = _format_pay(pay_raw)

    # descriptions 순회 (DESCRIPTION + OCR 두 타입만 잡코리아에서 실제로 사용)
    for desc in base_data.get("overview", {}).get("descriptions", []):
        dtype = desc.get("descriptionType", "")
        chunk_ref = desc.get("url", "").lstrip("$")
        s3_url = t_chunks.get(chunk_ref, "")
        if not s3_url or "amazonaws.com" not in s3_url:
            continue
        try:
            s3r = session.get(s3_url, timeout=10)
            s3r.raise_for_status()
            content_text = s3r.text
        except Exception:
            continue
        if dtype == "OCR":
            text = _clean(content_text)
            if text:
                # 여러 OCR 청크를 모두 누적 (이미지 1장당 1청크 구조)
                ocr_text = (ocr_text + "\n" + text) if ocr_text else text
        elif dtype == "DESCRIPTION":
            description_html = content_text

    # 내용형식 판단 (DESCRIPTION.html 안에 <img> 태그 있으면 이미지형)
    내용형식 = "text"
    포지션상세: str | None = None
    if description_html is not None:
        _soup_desc = BeautifulSoup(description_html, "html.parser")
        if _soup_desc.find("img"):
            내용형식 = "image"
            # 잡코리아 자체 OCR 텍스트 + DESCRIPTION 순수 텍스트 병합
            desc_text = _clean(_html_to_text(description_html))
            parts = [p for p in [ocr_text, desc_text] if p and p.strip()]
            포지션상세 = "\n".join(parts) if parts else None
        else:
            text = _clean(_html_to_text(description_html))
            포지션상세 = text if text else None
    elif ocr_text:
        내용형식 = "image"
        포지션상세 = ocr_text

    # 직무 카테고리: partCode 기반 DUTY_CODES 이름으로 변환
    직무카테고리 = "·".join(
        _DUTY_CODE_NAMES[p] for p in duty_parts if p in _DUTY_CODE_NAMES
    )

    # 학력
    edu_code = base_data.get("requirement", {}).get("educationCode", "")
    학력 = _EDUCATION_CODE_MAP.get(edu_code, "")

    return {
        "마감일": result_deadline,
        "내용형식": 내용형식,
        "고용형태": 고용형태,
        "경력": 경력,
        "지역": 지역,
        "급여": 급여,
        "기술스택": json.dumps(hard_skills, ensure_ascii=False),
        "포지션상세": 포지션상세,
        "직무카테고리": 직무카테고리,
        "학력": 학력,
    }


# ── STEP 3: 통합 수집 ─────────────────────────────────────
def crawl_all_jobkorea_jobs(limit: int | None = None):
    session = requests.Session()
    session.headers.update({
        "User-Agent": HEADERS["User-Agent"],
        "Accept-Language": HEADERS["Accept-Language"],
    })
    session.get("https://www.jobkorea.co.kr/", timeout=10)

    # 체크포인트 로드
    if pd.io.common.file_exists(CHECKPOINT_FILE):
        existing_df = pd.read_csv(CHECKPOINT_FILE, encoding="utf-8-sig")
        done_ids = set(existing_df["job_id"].dropna().astype(str).tolist())
        print(f"[체크포인트] 기존 수집 데이터 {len(done_ids)}개 로드 → 이어서 수집")
    else:
        existing_df = pd.DataFrame()
        done_ids = set()

    jobs = get_job_list(session, max_jobs=limit)
    if not jobs:
        return

    remaining = [j for j in jobs if str(j["job_id"]) not in done_ids]
    if limit:
        remaining = remaining[:limit]
    total = len(remaining)
    print(f"\n[2단계] 상세 내용 수집 중... (신규 {total}개, 요청 간 1초 딜레이)")

    new_rows = []
    for i, job in enumerate(remaining, 1):
        job_id = job["job_id"]
        detail = get_job_detail(session, job_id)
        # 마감일: 상세 페이지 우선, 없으면 목록 RSC 값 사용
        if not detail.get("마감일"):
            detail["마감일"] = job.pop("마감일_list", None)
        else:
            job.pop("마감일_list", None)
        row = {**job, **detail}
        new_rows.append(row)
        print(f"  [{i:04d}/{total}] {job['회사명']} - {job['공고명']}")

        if i % 50 == 0:
            _save_checkpoint(existing_df, new_rows)
            print(f"  💾 체크포인트 저장 ({len(done_ids) + i}개)")

        time.sleep(1)

    _save_checkpoint(existing_df, new_rows)

    final_df = pd.read_csv(CHECKPOINT_FILE, encoding="utf-8-sig")

    # 포지션상세·경력·고용형태 모두 빈 레코드 = 404로 내용 없는 껍데기 → 제거
    before = len(final_df)
    valid = (
        final_df["포지션상세"].notna() & (final_df["포지션상세"].astype(str) != "nan")
    ) | (
        final_df["경력"].notna() & (final_df["경력"].astype(str) != "nan")
    ) | (
        final_df["고용형태"].notna() & (final_df["고용형태"].astype(str) != "nan")
    )
    final_df = final_df[valid]
    print(
        f"\n[필터링] 빈 레코드 제거: {before}건 → {len(final_df)}건 (-{before - len(final_df)}건)")

    final_df.drop(columns=["job_id"], errors="ignore").to_csv(
        OUTPUT_FILE, index=False, encoding="utf-8-sig")

    missing = final_df.isnull().sum()
    if missing.any():
        print(f"\n[결측치 현황]\n{missing[missing > 0].to_string()}")
    print(f"\n총 {len(final_df)}개의 공고 → '{OUTPUT_FILE}' 저장 완료")


def _save_checkpoint(existing_df: pd.DataFrame, new_rows: list):
    new_df = pd.DataFrame(new_rows)
    merged = pd.concat([existing_df, new_df], ignore_index=True)
    merged.to_csv(CHECKPOINT_FILE, index=False, encoding="utf-8-sig")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None,
                        help="테스트용 수집 건수 제한")
    args = parser.parse_args()
    crawl_all_jobkorea_jobs(limit=args.limit)
