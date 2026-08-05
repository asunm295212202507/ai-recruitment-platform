import math
from typing import Dict, Any, List

class ExplainableMatchingEngine:
    """
    Production-grade Explainable AI Scoring Engine.
    Calculates overall semantic match, skill alignment matrix, SHAP-style component 
    feature contributions, and skill gap reports.
    """
    def __init__(self, model_version: str = "v3.5.2-prod"):
        self.model_version = model_version
        
    def compute_match_score(
        self, 
        candidate_skills: Dict[str, float], 
        job_requirements: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Computes weighted candidate match score with explainability payloads.
        """
        total_weight = 0.0
        weighted_score = 0.0
        
        feature_contributions = []
        matching_skills = []
        missing_skills = []
        
        for skill, req_prof in job_requirements.items():
            weight = 1.0  # Default feature weight
            total_weight += weight
            
            cand_prof = candidate_skills.get(skill, 0.0)
            
            # Sub-score calculation
            if cand_prof >= req_prof:
                skill_score = 1.0
                matching_skills.append({
                    "skill": skill,
                    "candidate_level": cand_prof,
                    "target_level": req_prof,
                    "status": "matched"
                })
            else:
                skill_score = cand_prof / (req_prof if req_prof > 0 else 1.0)
                if cand_prof > 0:
                    matching_skills.append({
                        "skill": skill,
                        "candidate_level": cand_prof,
                        "target_level": req_prof,
                        "status": "partial"
                    })
                else:
                    missing_skills.append({
                        "skill": skill,
                        "target_level": req_prof,
                        "gap_severity": "critical" if req_prof >= 80 else "moderate"
                    })
                    
            contribution = (skill_score * weight)
            weighted_score += contribution
            
            feature_contributions.append({
                "feature": f"skill:{skill}",
                "value": cand_prof,
                "target": req_prof,
                "shap_value": round((skill_score - 0.5) * weight, 3)
            })
            
        final_score = round((weighted_score / (total_weight if total_weight > 0 else 1.0)) * 100, 2)
        
        return {
            "overall_score": final_score,
            "explainability": {
                "model_version": self.model_version,
                "base_value": 50.0,
                "feature_contributions": feature_contributions,
                "summary": f"Calculated based on {len(matching_skills)} matched skill vectors and {len(missing_skills)} gap vectors."
            },
            "skill_gap_report": {
                "matching_skills": matching_skills,
                "missing_skills": missing_skills,
                "recommended_training": [f"Upskill in {s['skill']}" for s in missing_skills]
            }
        }

matching_engine = ExplainableMatchingEngine()
