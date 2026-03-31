FROM python:3.11-slim

RUN apt-get update && apt-get install -y cron && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 새벽 2시마다 cutoff 배치 실행
RUN echo "0 2 * * * root python /app/calculate_job_cutoff.py >> /var/log/batch.log 2>&1" > /etc/cron.d/batch-cron
RUN chmod 0644 /etc/cron.d/batch-cron
RUN touch /var/log/batch.log

CMD ["cron", "-f"]
