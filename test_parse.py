import json

with open("json_out.txt", encoding='utf-8') as f:
    data = json.load(f)

for row in data:
    print(f"Deadline: {row.get('deadline')}, Top%: {row.get('topPercentile')}, title: {row.get('title')}")
