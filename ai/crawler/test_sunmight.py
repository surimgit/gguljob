import asyncio
from postprocess_it_strict_superfast import client, MODEL, SYSTEM_PROMPT
import pandas as pd
import json

async def test():
    df = pd.read_csv('jobkorea_jobs_all.csv', encoding='utf-8-sig', dtype=str)
    sun = df[df['Job_ID'] == '48605597'] if 'Job_ID' in df.columns else df[df['링크'].str.contains('48605597', na=False)]
    content = str(sun['포지션상세'].iloc[0])
    job_id = "48605597"
    user_msg = f"==== Job_ID: {job_id} ====\n{content}"
    
    print("Requesting GPT for Sunmight...")
    resp = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg}
        ],
        response_format={"type": "json_object"},
        temperature=0.0
    )
    raw_text = resp.choices[0].message.content.strip()
    print("Result:")
    print(raw_text)

if __name__ == '__main__':
    asyncio.run(test())
