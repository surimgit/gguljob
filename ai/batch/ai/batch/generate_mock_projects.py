import random
from datetime import datetime, timedelta

# User IDs constraint: 5~54
USER_IDS = list(range(5, 55))

DOMAINS = ["WEB", "APP", "AI", "GAME", "SYSTEM", "DATA"]
STATUSES = ["RECRUITING", "IN_PROGRESS", "COMPLETED", "CANCELED"]

dummy_readme_templates = [
    "# {title}\n\n## Overview\nThis project aims to solve complex problems in {domain} domain.\n\n## Features\n- Feature 1\n- Feature 2\n\n## Tech Stack\n- Java 17\n- Spring Boot 3\n- React",
    "# Awesome {title}\n\nA revolutionary {domain} project.\n\n### How to run\n`docker-compose up -d`\n\n### Contributing\nPRs are welcome!",
    "# {title} - {domain} Project\n\n## Background\nCreated during the 2024 hackathon.\n\n## Architecture\nMicroservices with event-driven design."
]

def generate_insert_statements():
    statements = []
    
    project_id_counter = 3
    
    # 0 to 3 projects per user (as leader)
    for leader_id in USER_IDS:
        num_projects = random.randint(0, 3)
        for _ in range(num_projects):
            team_name = f"Team_{leader_id}_{random.randint(100, 999)}"
            title = f"Project {project_id_counter}"
            domain = random.choice(DOMAINS)
            description = f"Short description for {title}"
            status = random.choice(STATUSES)
            is_public = random.choice(["TRUE", "FALSE"]) # true/false
            
            # generating readme
            readme_template = random.choice(dummy_readme_templates)
            readme = readme_template.format(title=title, domain=domain).replace('\n', '\\n')
            
            created_at = (datetime.now() - timedelta(days=random.randint(10, 100))).strftime('%Y-%m-%d %H:%M:%S')
            finished_at = "NULL" if status != "COMPLETED" else f"'{ (datetime.now() - timedelta(days=random.randint(1, 9))).strftime('%Y-%m-%d %H:%M:%S') }'"
            
            # The user specifically requested inserting into `readme` column. 
            # Description is for short one-liner
            sql = f"INSERT INTO projects (project_id, leader_id, team_name, title, domain, description, status, is_public, readme, created_at, finished_at) VALUES ({project_id_counter}, {leader_id}, '{team_name}', '{title}', '{domain}', '{description}', '{status}', {is_public}, '{readme}', '{created_at}', {finished_at});"
            
            statements.append(sql)
            project_id_counter += 1
            
    return statements

if __name__ == "__main__":
    sqls = generate_insert_statements()
    with open("ai/batch/insert_mock_projects.sql", "w", encoding="utf-8") as f:
        f.write("-- Mock Projects Data (IDs start at 3)\n")
        f.write("USE gguljob_dev;\n\n")
        for sql in sqls:
            f.write(sql + "\n")
            
    print(f"Generated {len(sqls)} project insert statements in ai/batch/insert_mock_projects.sql")
