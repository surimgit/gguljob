# -*- coding: utf-8 -*-
import random
from datetime import datetime, timedelta
import os

USER_IDS = list(range(5, 55))
STATUSES = ["RECRUITING", "IN_PROGRESS", "COMPLETED", "CANCELED"]

blueprints = [
    {
        "domain": "WEB",
        "title_base": "실시간 협업 웹 플랫폼 Collabo v{}",
        "description": "웹소켓 지원으로 다중 사용자가 동시에 문서를 편집할 수 있는 팀 프로젝트 관리 툴입니다.",
        "readme": "# Collabo - 실시간 협업 웹 플랫폼\n\n## 💡 프로젝트 소개\n재택근무 및 비대면 환경의 증가로 실시간 협업의 중요성이 대두되었습니다. Collabo는 팀원들이 언제 어디서든 끊김 없이 소통하고 프로젝트를 관리할 수 있는 All-in-One 웹 서비스입니다.\n\n## 🚀 핵심 기능\n1. **실시간 문서 동시 편집**: 웹소켓을 통한 실시간 타이핑 공유 및 충돌 방지 로직 적용\n2. **드래그 앤 드롭 칸반 보드**: 직관적인 UI/UX로 업무 진행 상황(To Do, In Progress, Done) 관리\n3. **프로젝트 단위 그룹 채팅**: 업무 히스토리가 기록되는 스레드형 채팅 지원\n\n## 🛠 기술 스택\n- **Backend**: Spring Boot 3, Java 17, JPA, WebSocket(STOMP)\n- **Frontend**: React 18, TypeScript, TailwindCSS\n- **Database/Cache**: MySQL 8.x, Redis\n- **Infra**: AWS EC2, S3, RDS, GitHub Actions (CI/CD)\n\n## 🔥 성과 및 트러블 슈팅\n- 대용량 트래픽 대비: Ngrinder를 사용한 부하 테스트로 임계점 파악 및 병목 지점(채팅방 조회)에 분산 캐시 적용.\n- 응답 속도 개선: 쿼리 N+1 문제 해결을 통해 조회 성능 45% 향상."
    },
    {
        "domain": "APP",
        "title_base": "동네 기반 반려견 산책 메이트 매칭 앱 댕댕워크 v{}",
        "description": "위치 기반으로 근처의 반려가족들과 산책 일정을 공유하고 함께 만날 수 있는 소셜 매칭 모바일 앱",
        "readme": "# 댕댕워크 (DangDangWalk)\n\n## 🐶 서비스 개요\n반려견의 사회성 부족 고민, 이제 댕댕워크에서 동네 산책 크루를 만나 해결하세요! GPS 기반으로 우리 동네의 산책로를 공유하고 일정을 맞출 수 있는 소셜 네트워킹 크로스플랫폼 앱입니다.\n\n## 📱 주요 화면 및 기능\n- **주변 산책팟 조회**: 내 주변 2km 내에 있는 사용자 프로필 및 반려견 정보 지도 표시 (Google Maps API 활용)\n- **산책 크루 모집**: 날짜, 시간, 반려견 성향(소형견, 대형견, 사회성 등)에 맞춘 모집글 작성 및 수락 기능\n- **산책 기록 트래킹**: 산책한 동선과 소모 칼로리, 시간 등을 기록하여 통계 제공\n\n## ⚙️ 아키텍처 및 기술\n- **Client**: Flutter, Dart\n- **Server**: Node.js (Express), Socket.io (실시간 채팅)\n- **Database**: MongoDB (위치 데이터 처리에 적합한 Geospatial Index 활용)\n\n## 💡 주안점\n- 실시간 위치 공유 시 배터리 소모를 줄이기 위해 백그라운드 위치 업데이트 주기 최적화\n- REST API 설계 원칙을 준수하여 확장성 높은 서버 구조 설계"
    },
    {
        "domain": "AI",
        "title_base": "LLM 기반 모의면접 자동 피드백 서비스 Interview-GPT {}",
        "description": "구직자의 음성을 실시간 변환하고, LLM을 통해 꼬리질문과 답변 피드백을 제공하는 AI 면접관 플랫폼",
        "readme": "# Interview-GPT 🤖\n\n## 🔍 기획 배경\n취업 준비생들이 면접 학원이나 스터디 없이도 언제든 실전 같은 면접을 경험할 수 있도록 돕고자 프롬프트 엔지니어링과 STT/TTS 기술을 결합하여 가상의 면접관을 구현했습니다.\n\n## 🎯 주요 기능\n- **맞춤형 질문 생성**: 이력서 데이터 파싱 및 직무 맞춤형 초기 면접 질문 자동 추출\n- **실시간 STT/TTS 대화**: 사용자의 음성을 텍스트로 변환 후, AI 면접관이 맥락에 맞는 꼬리질문 진행\n- **면접 리포트 발급**: 시선 처리, 목소리 크기, 답변의 논리성 등을 종합한 최종 피드백 리포트 제공\n\n## 🧠 기술 스택 - AI 파트\n- **LLM**: OpenAI GPT-4 API (프롬프트 튜닝, Few-shot 러닝 적용)\n- **Speech**: Whisper API (STT), Google Cloud TTS\n- **Vision**: MediaPipe (실시간 안면 및 시선 추적)\n- **Backend**: FastAPI, Python\n\n## 🚀 핵심 성과\n- 약 1,000건의 면접 Q&A 데이터를 활용한 프롬프트 최적화로 환각(Hallucination) 현상 방지\n- 프론트엔드와 AI 서버 간 WebSocket 통신을 통해 음성 처리 지연 시간(Latency) 1.5초 이내 방어"
    },
    {
        "domain": "GAME",
        "title_base": "2D 픽셀아트 생존 로그라이크 Dark-Dungeon {}",
        "description": "절차적 맵 생성 시스템과 다양한 무기 조합의 재미를 내세운 2D 쿼터뷰 액션 하드코어 로그라이크",
        "readme": "# Dark-Dungeon 🎮\n\n## 📖 게임 소개\n어둠에 잠긴 지하 던전을 탈출하기 위해 끊임없이 몰려오는 몬스터들과 함정을 극복해야 하는 2D 플랫포머 하드코어 액션 게임입니다. 죽으면 모든 것을 잃지만 경험은 남습니다.\n\n## ⚔️ 코어 메커니즘\n- **절차적 맵 생성 (Procedural Generation)**: Random Walk 알고리즘을 응용하여 매 판마다 완전히 다른 구조의 던전 생성\n- **시너지 시스템**: 30여 종의 무기와 패시브 유물들을 조합하여 자신만의 유니크한 공격 빌드 구성 가능\n- **다이나믹 픽셀 라이팅**: 2D 광원 효과를 극대화시켜 횃불, 마법 이펙트 등 동적인 빛에 따라 시야가 제약되는 시스템 연출\n\n## 🛠 개발 환경\n- **Engine**: Unity 2D (C#)\n- **Art**: Aseprite (에셋 100% 자체 제작)\n\n## 🔬 트러블 슈팅 포인트\n- 오브젝트 풀링(Object Pooling) 패턴을 적극 도입하여 수백 개의 몬스터와 투사체가 동시에 렌더링될 때의 가비지 컬렉션(GC) 스파이크 및 프레임 드랍 문제 완화\n- FSM(Finite State Machine) 디자인 패턴을 활용한 보스 몬스터의 정교한 공격 페이즈 구현"
    },
    {
        "domain": "DATA",
        "title_base": "서울시 심야 대중교통 노선 최적화 분석 파이프라인 {}",
        "description": "카드 승하차 데이터와 통신사 유동인구 데이터를 결합하여 심야 대중교통 최적 노선을 제안하는 데이터 분석 프로젝트",
        "readme": "# 서울시 심야 교통 노선 최적화 프레임워크 🚌\n\n## 📊 분석 개요\n심야 시간대 주요 번화가의 대중교통 사각지대 현상을 해소하기 위해, 서울시 공공데이터와 통신사 유동인구 데이터를 결합 분석하여 가장 경제적이고 효율적인 신규 심야 버스 노선을 도출하는 빅데이터 파이프라인 구축 프로젝트입니다.\n\n## 📈 파이프라인 아키텍처\n1. **Data Ingestion**: 공공데이터 포털 Open API 스케줄링 적재 (Airflow 처리)\n2. **Data Storage & Processing**: AWS S3 적재 -> Apache Spark 기반의 대용량 데이터 분산 정제 -> Data Warehouse 적재\n3. **Clustering 분석**: K-Means 클러스터링으로 주요 심야 인구 밀집 지역(Hotspot) 파악 및 노드화\n4. **Visualization**: Tableau를 활용한 최종 노선도 인사이트 대시보드 배포\n\n## 💻 기술 스택\n- Python, Pandas, Scikit-learn, PySpark\n- AWS (S3, EMR, Athena), Apache Airflow\n\n## 🏆 인사이트 도출 결론\n- 기존 심야버스 노선 대비 교통 소외지역의 대기 시간 평균 15% 단축 모델 도출\n- 강남-신림, 홍대-이태원 구간 등 주요 취약 구간의 심야 배차 간격 조정에 대한 통계적 근거 확보 체계 구축"
    },
    {
        "domain": "SYSTEM",
        "title_base": "분산 환경 티켓팅 트래픽 처리 플랫폼 Ticket-Catch {}",
        "description": "대규모 트래픽이 몰리는 티켓팅 상황을 분산 시스템으로 해결한 MSA 아키텍처 이벤트 기반 예매 서버",
        "readme": "# 티켓팅 분산 시스템 Ticket-Catch 🎫\n\n## 🏗 프로젝트 목표\n유명 아이돌 콘서트나 명절 기차표 예매처럼 특정 순간에 트래픽이 수백 배로 폭증하는 상황에서도, 메인 서버의 병목현상을 막고 사용자 대기열을 순차적으로 안전하게 처리할 수 있는 아키텍처 설계 및 구현을 목표로 합니다.\n\n## ⚙️ 시스템 아키텍처 특장점\n- 인증, 결제, 예매, 대기열 서비스로 완벽히 분리된 마이크로서비스 아키텍처(MSA) 결합\n- 비동기 이벤트 기반(Event-Driven) 통신을 위한 Message Queue 인프라 활용\n\n## 🛠 기술 및 인프라\n- **Backend**: Spring Boot, Spring Cloud, Spring Security\n- **Message Broker**: Apache Kafka (티켓 발급 및 포인트 차감 처리)\n- **Cache/DB**: Redis (대기열 토큰 관리, 잔여 좌석 캐싱), MySQL(Replication)\n- **DevOps**: Docker, Kubernetes, Prometheus, Grafana\n\n## 🔥 성능 최적화 경험\n- **대기열 토큰 시스템**: Redis의 Sorted Set을 활용하여 초당 10만 건 이상의 접속자 접속 요청에 대해 O(log N)으로 공정한 진입 순번 발급\n- **분산 트랜잭션 (Saga Pattern)**: 티켓 예매 중 결제 실패 혹은 재고 부족 시 Kafka 이벤트를 롤백하는 Saga Choreography 패턴 적용\n- **부하 테스트 및 튜닝**: Jmeter를 활용한 Vuser 시뮬레이션으로 TPS 측정 후, WAS Thread Pool 조정과 쿼리 튜닝으로 최종 TPS 4,500 달성"
    }
]

def generate_insert_statements():
    statements = []
    project_id_counter = 3
    
    for leader_id in USER_IDS:
        # random amount of projects
        num_projects = random.randint(0, 3)
        for _ in range(num_projects):
            bp = random.choice(blueprints)
            
            team_name = f"Team_{leader_id}_{random.randint(100, 999)}"
            # 버전 번호를 랜덤으로 주어 이름이 완전히 똑같지 않게
            version_str = f"{random.randint(1, 4)}.{random.randint(0, 9)}"
            
            # 여기서 모든 단일 따옴표 자체를 확실하게 방어
            title = bp["title_base"].format(version_str).replace("'", "''")
            domain = bp["domain"].replace("'", "''")
            description = bp["description"].replace("'", "''")
            status = random.choice(STATUSES)
            is_public = random.choice(["TRUE", "FALSE"])
            
            readme_raw = bp["readme"]
            # SQL에서 작은따옴표를 처리하기 위해 ''로 치환, 줄바꿈은 \n으로
            readme = readme_raw.replace("'", "''").replace('\n', '\\n')
            
            created_at = (datetime.now() - timedelta(days=random.randint(10, 100))).strftime('%Y-%m-%d %H:%M:%S')
            finished_at = "NULL" if status != "COMPLETED" else f"'{ (datetime.now() - timedelta(days=random.randint(1, 9))).strftime('%Y-%m-%d %H:%M:%S') }'"
            
            sql = f"INSERT INTO projects (project_id, leader_id, team_name, title, domain, description, status, is_public, readme, created_at, finished_at) VALUES ({project_id_counter}, {leader_id}, '{team_name}', '{title}', '{domain}', '{description}', '{status}', {is_public}, '{readme}', '{created_at}', {finished_at});"
            
            statements.append(sql)
            project_id_counter += 1
            
    return statements

if __name__ == "__main__":
    sqls = generate_insert_statements()
    out_path = "ai/batch/insert_mock_projects.sql"
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("-- Mock Projects Data (IDs start at 3)\n")
        f.write("USE gguljob_dev;\n\n")
        f.write("SET NAMES utf8mb4;\n")
        f.write("DELETE FROM projects WHERE project_id >= 3;\n\n")
        for sql in sqls:
            f.write(sql + "\n")
            
    print("Generated {} project insert statements in {}".format(len(sqls), out_path))
