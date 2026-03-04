# 1. Base Image (Java 21)
FROM eclipse-temurin:21-jdk-jammy AS builder

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 의존성 파일만 먼저 복사
# 소스 코드가 바뀌어도 라이브러리는 다시 받지 않게 하기 위함입니다.
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

#  실행 권한 부여 (윈도우 -> 리눅스 이동 시 깨짐 방지)
RUN chmod +x ./gradlew

# 4. 의존성 다운로드 (Wrapper 사용)
RUN ./gradlew dependencies --no-daemon

# 5. 소스 코드 복사
COPY src ./src

# 6. 빌드 수행
# bootJar: plain jar 생성을 방지하고 실행 가능한 jar만 명확히 빌드합니다.
RUN ./gradlew clean bootJar -x test --no-daemon

# --- 실행 단계 (Runtime Stage) ---
FROM eclipse-temurin:21-jre-jammy

# ★ 이 두 줄을 반드시 추가하십시오! ★
RUN apt-get update && apt-get install -y curl

WORKDIR /app

# 7. [수정] 명확한 파일명 복사
# 빌드 과정에서 bootJar를 썼으므로 실행 가능한 jar 하나만 생성됩니다.
# COPY --from=builder /app/build/libs/*.jar app.jar (이제 안전)
COPY --from=builder /app/build/libs/*.jar app.jar

# 8. 실행 명령어
ENTRYPOINT ["java", "-jar", "-Duser.timezone=Asia/Seoul", "app.jar"]