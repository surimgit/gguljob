import argparse
import ast
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Set, Tuple

import pandas as pd


@dataclass(frozen=True)
class SkillDef:
    skill_id: int
    name: str
    synonyms: str


SKILL_DEFINITIONS: List[SkillDef] = [
    SkillDef(1, "React", "react,react.js,reactjs,ri-aegteu"),
    SkillDef(2, "Vue.js", "vue,vue.js,vuejs,byu"),
    SkillDef(3, "Java", "java,jvm"),
    SkillDef(4, "Spring Boot", "spring,springboot,spring boot,spring framework"),
    SkillDef(5, "Python", "python,py"),
    SkillDef(6, "MySQL", "mysql,my sql"),
    SkillDef(7, "AWS", "aws,amazon web services"),
    SkillDef(8, "Docker", "docker"),
    SkillDef(9, "Kubernetes", "kubernetes,k8s"),
    SkillDef(10, "Jenkins", "jenkins"),
    SkillDef(11, "Git", "git,github,gitlab"),
    SkillDef(12, "Redis", "redis"),
    SkillDef(13, "C", "c,ansi c"),
    SkillDef(14, "C#", "c#,csharp"),
    SkillDef(15, "C++", "c++,cpp"),
    SkillDef(16, "JavaScript", "javascript,js,es6"),
    SkillDef(17, "TypeScript", "typescript,ts"),
    SkillDef(18, "HTML/CSS", "html,html5,css,css3"),
    SkillDef(19, "Next.js", "next.js,nextjs"),
    SkillDef(20, "Node.js", "node.js,nodejs,node"),
    SkillDef(21, "Oracle DB", "oracle,oracledb,oracle db"),
    SkillDef(22, "PostgreSQL", "postgresql,postgres,postgre"),
    SkillDef(23, "MariaDB", "mariadb,maria db"),
    SkillDef(24, "MongoDB", "mongodb,mongo db,nosql"),
    SkillDef(25, "PHP", "php"),
    SkillDef(26, ".NET", ".net,asp.net,dotnet,dotnetcore"),
    SkillDef(27, "Nest.js", "nest.js,nestjs,nest"),
    SkillDef(28, "Kafka", "kafka,apache kafka"),
    SkillDef(29, "Linux", "linux,unix,ubuntu,centos"),
    SkillDef(30, "Azure", "azure,ms azure,microsoft azure"),
    SkillDef(31, "GCP", "gcp,google cloud"),
    SkillDef(32, "Android", "android"),
    SkillDef(33, "iOS", "ios"),
    SkillDef(34, "Kotlin", "kotlin"),
    SkillDef(35, "Flutter", "flutter"),
    SkillDef(36, "React Native", "react native,rn"),
    SkillDef(37, "PyTorch", "pytorch"),
    SkillDef(38, "TensorFlow", "tensorflow"),
    SkillDef(39, "Jira", "jira"),
    SkillDef(40, "Figma", "figma"),
    SkillDef(41, "MSSQL", "mssql,sql server,ms-sql,microsoft sql"),
    SkillDef(42, "JSP", "jsp,java server pages"),
    SkillDef(43, "JPA", "jpa,spring data jpa"),
    SkillDef(44, "MyBatis", "mybatis,ibatis"),
    SkillDef(45, "FastAPI", "fastapi,fast api"),
    SkillDef(46, "jQuery", "jquery,j query"),
    SkillDef(47, "Ajax", "ajax"),
    SkillDef(48, "Nexacro", "nexacro"),
    SkillDef(49, "WebSquare", "websquare"),
    SkillDef(50, "OpenCV", "opencv,open cv"),
    SkillDef(51, "Hadoop", "hadoop"),
    SkillDef(52, "Unity", "unity,unity3d"),
    SkillDef(53, "MFC/WPF", "mfc,wpf"),
    SkillDef(54, "RDBMS/DBMS", "rdbms,dbms,relational database"),
    SkillDef(55, "전자정부프레임워크", "전자정부표준프레임워크,egovframe,e-gov"),
    SkillDef(56, "RAG", "rag,retrieval augmented generation"),
    SkillDef(57, "LLM", "llm,large language model"),
    SkillDef(58, "VMware", "vmware"),
    SkillDef(59, "MSA", "msa,microservice,microservices,micro service"),
    SkillDef(60, "Tibero", "tibero"),
    SkillDef(61, "SAP", "sap"),
    SkillDef(62, "Airflow", "airflow,apache airflow"),
    SkillDef(63, "Django", "django"),
    SkillDef(64, "Flask", "flask"),
    SkillDef(65, "Nginx", "nginx"),
    SkillDef(66, "Swift", "swift"),
    SkillDef(67, "MLOps", "mlops,ml ops"),
    SkillDef(68, "임베디드 Linux", "임베디드리눅스,embedded linux"),
    SkillDef(69, "Windows", "windows,window"),
    SkillDef(70, "AI", "ai,인공지능,인공지능(ai)"),
    SkillDef(71, "MES", "mes,manufacturing execution system"),
    SkillDef(72, "ISMS", "isms,isms-p"),
]


DROP_PATTERNS = [
    re.compile(r".*(toeic|opic|ielts|toefl|english|\uc601\uc5b4).*", re.IGNORECASE),
    re.compile(r".*(\uc790\uaca9|\uba74\ud5c8|\uae30\uc0ac|\uc0b0\uc5c5\uae30\uc0ac|\uae30\ub2a5\uc0ac).*", re.IGNORECASE),
    re.compile(r".*(\ucef4\ud4e8\ud130\ud65c\uc6a9\ub2a5\ub825|microsoft office|excel|powerpoint|word|oa|\ud55c\ucef4).*", re.IGNORECASE),
    re.compile(r".*(\ud480\uc2a4\ud0dd|fullstack|devops|\uc6cc\ub4dc|\ub124\ud2b8\uc6cc\ud06c).*", re.IGNORECASE),
]


def canonical_key(text: str) -> str:
    s = text.strip().lower()
    s = s.replace("\\", " ")
    s = s.replace("_", " ")
    s = s.replace("-", " ")
    s = s.replace("/", " ")
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def parse_list_cell(value: object) -> List[str]:
    if pd.isna(value):
        return []

    raw = str(value).strip()
    if not raw or raw == "[]":
        return []

    # JSON-ish list string
    if raw.startswith("[") and raw.endswith("]"):
        try:
            loaded = json.loads(raw)
            if isinstance(loaded, list):
                return [str(x).strip() for x in loaded if str(x).strip()]
        except json.JSONDecodeError:
            pass

        try:
            loaded = ast.literal_eval(raw)
            if isinstance(loaded, list):
                return [str(x).strip() for x in loaded if str(x).strip()]
        except (ValueError, SyntaxError):
            pass

    # Fallback for comma separated values.
    return [part.strip() for part in raw.split(",") if part.strip()]


def should_drop(token: str) -> bool:
    key = canonical_key(token)
    return any(pattern.match(key) for pattern in DROP_PATTERNS)


def build_alias_maps(skills: Iterable[SkillDef]) -> Tuple[Dict[str, SkillDef], Dict[int, SkillDef]]:
    alias_map: Dict[str, SkillDef] = {}
    id_map: Dict[int, SkillDef] = {}

    for skill in skills:
        id_map[skill.skill_id] = skill
        variants = [skill.name] + [s.strip() for s in skill.synonyms.split(",") if s.strip()]
        for v in variants:
            alias_map[canonical_key(v)] = skill

    # Domain-specific explicit alias fixes from real crawled data.
    extra_aliases = {
        "restapi": 47,
        "restful api": 47,
        "reactjs": 1,
        "oracledb": 21,
        "asp.net": 26,
        "dotnet": 26,
        "ci cd": 10,
        "k8s": 9,
        "window": 69,
        "windows": 69,
        "egov": 55,
        "e gov": 55,
        "ai agent": 70,
        "artificial intelligence": 70,
        "embedded linux": 68,
    }
    for alias, skill_id in extra_aliases.items():
        if skill_id in id_map:
            alias_map[canonical_key(alias)] = id_map[skill_id]

    return alias_map, id_map


def normalize_skills(raw_tokens: List[str], alias_map: Dict[str, SkillDef]) -> Tuple[List[SkillDef], List[str]]:
    matched: List[SkillDef] = []
    unknown: List[str] = []
    seen_skill_ids: Set[int] = set()

    for token in raw_tokens:
        if not token:
            continue
        if should_drop(token):
            continue

        key = canonical_key(token)
        if not key:
            continue

        skill = alias_map.get(key)
        if skill is None:
            # Contains matching for strings like "spring framework" etc.
            for alias_key, alias_skill in alias_map.items():
                if key == alias_key or key in alias_key or alias_key in key:
                    skill = alias_skill
                    break

        if skill is None:
            unknown.append(token)
            continue

        if skill.skill_id not in seen_skill_ids:
            matched.append(skill)
            seen_skill_ids.add(skill.skill_id)

    matched.sort(key=lambda s: s.skill_id)
    unknown = sorted(set(unknown))
    return matched, unknown


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize crawled tech stacks into canonical skill IDs.")
    parser.add_argument("--input", default="jobkorea_jobs_final_it_only.csv")
    parser.add_argument("--output", default="jobkorea_jobs_final_it_only_normalized.csv")
    parser.add_argument("--mapping-output", default="job_posting_skill_mapping.csv")
    parser.add_argument("--summary-output", default="skill_normalization_summary.txt")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    df = pd.read_csv(input_path, encoding="utf-8-sig")
    if "Job_ID" not in df.columns:
        raise ValueError("Input CSV must include 'Job_ID' column.")

    alias_map, _ = build_alias_maps(SKILL_DEFINITIONS)

    normalized_names_col: List[str] = []
    normalized_ids_col: List[str] = []
    raw_merged_col: List[str] = []
    unknown_col: List[str] = []

    mapping_rows: List[Dict[str, object]] = []
    unknown_counter: Dict[str, int] = {}

    for _, row in df.iterrows():
        raw_source = parse_list_cell(row.get("기술스택", "")) + parse_list_cell(row.get("gpt_기술스택", ""))
        raw_source = [s for s in raw_source if s]

        matched_skills, unknown_skills = normalize_skills(raw_source, alias_map)

        normalized_names = [s.name for s in matched_skills]
        normalized_ids = [s.skill_id for s in matched_skills]

        normalized_names_col.append(json.dumps(normalized_names, ensure_ascii=False))
        normalized_ids_col.append(json.dumps(normalized_ids, ensure_ascii=False))
        raw_merged_col.append(json.dumps(sorted(set(raw_source)), ensure_ascii=False))
        unknown_col.append(json.dumps(unknown_skills, ensure_ascii=False))

        job_id = str(row["Job_ID"]).strip()
        for skill in matched_skills:
            mapping_rows.append(
                {
                    "origin_job_id": job_id,
                    "skill_id": skill.skill_id,
                    "skill_name": skill.name,
                }
            )

        for unk in unknown_skills:
            unknown_counter[unk] = unknown_counter.get(unk, 0) + 1

    df["raw_merged_skills"] = raw_merged_col
    df["normalized_skill_names"] = normalized_names_col
    df["normalized_skill_ids"] = normalized_ids_col
    df["unknown_skills"] = unknown_col

    output_path = Path(args.output)
    mapping_output_path = Path(args.mapping_output)
    summary_output_path = Path(args.summary_output)

    df.to_csv(output_path, index=False, encoding="utf-8-sig")
    pd.DataFrame(mapping_rows).drop_duplicates().to_csv(mapping_output_path, index=False, encoding="utf-8-sig")

    total_rows = len(df)
    mapped_rows = (df["normalized_skill_ids"] != "[]").sum()
    total_mapping_links = len(mapping_rows)
    top_unknown = sorted(unknown_counter.items(), key=lambda x: x[1], reverse=True)[:30]

    lines = [
        "Skill Normalization Summary",
        f"Input rows: {total_rows}",
        f"Rows with >=1 mapped skill: {mapped_rows}",
        f"Total job-skill mapping links: {total_mapping_links}",
        "",
        "Top unknown skills:",
    ]
    lines.extend([f"- {name}: {count}" for name, count in top_unknown])
    summary_output_path.write_text("\n".join(lines), encoding="utf-8")

    print(f"[DONE] normalized file: {output_path}")
    print(f"[DONE] mapping file: {mapping_output_path}")
    print(f"[DONE] summary file: {summary_output_path}")
    print(f"[INFO] rows with mapped skills: {mapped_rows}/{total_rows}")


if __name__ == "__main__":
    main()
