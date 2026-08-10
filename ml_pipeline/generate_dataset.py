import os
import json
import random
import pandas as pd

def generate_recruitment_dataset(num_samples=1000, seed=42):
    """
    Generates a production-grade synthetic dataset for AI recruitment model training.
    Includes resume skill vectors, job requirement vectors, experience years,
    ground truth match scores, category classifications, and salary benchmarks.
    """
    random.seed(seed)
    
    categories = ["Engineering", "Product", "Infrastructure", "Design", "Analytics"]
    
    skill_pool = {
        "Engineering": ["React", "Node.js", "JavaScript", "TypeScript", "Python", "AWS", "System Design", "GraphQL", "PostgreSQL", "Docker"],
        "Product": ["Agile", "Product Strategy", "SaaS", "Roadmapping", "Analytics", "User Research", "Scrum", "Wireframing"],
        "Infrastructure": ["Kubernetes", "Docker", "CI/CD", "Terraform", "Python", "AWS", "Linux", "Ansible", "Prometheus"],
        "Design": ["Figma", "UI/UX", "User Research", "Prototyping", "Design Systems", "HTML/CSS", "Wireframing"],
        "Analytics": ["SQL", "Python", "Tableau", "PowerBI", "Machine Learning", "Statistics", "Data Modeling"]
    }
    
    records = []
    
    for i in range(1, num_samples + 1):
        category = random.choice(categories)
        years_exp = round(random.uniform(1.0, 15.0), 1)
        
        # Select 3-6 skills for candidate
        cand_skills = random.sample(skill_pool[category], k=random.randint(3, min(6, len(skill_pool[category]))))
        skill_proficiencies = {skill: random.randint(60, 98) for skill in cand_skills}
        
        # Target Job Requirements
        job_skills = random.sample(skill_pool[category], k=random.randint(3, 5))
        job_requirements = {skill: random.randint(70, 90) for skill in job_skills}
        
        # Calculate overlap match score
        matched_count = len(set(cand_skills).intersection(set(job_skills)))
        match_ratio = matched_count / len(job_skills)
        base_score = match_ratio * 70.0 + (years_exp / 15.0) * 20.0 + random.uniform(0, 10.0)
        final_match_score = round(min(98.0, max(45.0, base_score)), 1)
        
        # Calculate salary prediction benchmark
        base_salary = 85000 + (years_exp * 7000) + (final_match_score * 400)
        target_salary = int(round(base_salary, -3))
        
        # Calculate success index
        success_index = round(min(98.0, final_match_score * 0.92 + random.uniform(2, 8)), 1)
        
        # Demographic group marker for NYC Law 144 fairness auditing
        demographic_group = random.choice(["Group_A", "Group_B", "Group_C", "Group_D"])
        
        records.append({
            "candidate_id": f"CAND-{i:04d}",
            "category": category,
            "years_experience": years_exp,
            "candidate_skills": json.dumps(skill_proficiencies),
            "job_requirements": json.dumps(job_requirements),
            "matched_skills_count": matched_count,
            "match_score": final_match_score,
            "target_salary": target_salary,
            "success_index": success_index,
            "demographic_group": demographic_group,
            "resume_text_snippet": f"Experienced {category} specialist with {years_exp} years working with {', '.join(cand_skills)}."
        })
        
    df = pd.DataFrame(records)
    
    output_dir = os.path.join(os.path.dirname(__file__), "dataset")
    os.makedirs(output_dir, exist_ok=True)
    
    csv_path = os.path.join(output_dir, "recruitment_training_data.csv")
    df.to_csv(csv_path, index=False)
    
    summary = {
        "total_samples": num_samples,
        "categories": df["category"].value_counts().to_dict(),
        "avg_years_experience": round(df["years_experience"].mean(), 2),
        "avg_match_score": round(df["match_score"].mean(), 2),
        "avg_salary": round(df["target_salary"].mean(), 2),
        "dataset_path": csv_path
    }
    
    with open(os.path.join(output_dir, "dataset_summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
        
    print(f"[DONE] Generated dataset with {num_samples} records at: {csv_path}")
    return csv_path

if __name__ == "__main__":
    generate_recruitment_dataset()
