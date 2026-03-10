import requests
from bs4 import BeautifulSoup


def crawl_jobs(url: str) -> list[dict]:
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # TODO: 실제 크롤링 대상 사이트에 맞게 수정
    results = []
    return results
