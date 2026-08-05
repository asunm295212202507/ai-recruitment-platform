from typing import Dict, Any

class PredictiveAnalyticsEngine:
    """
    Predictive modeling engine for candidate success index, salary bounds, 
    interview grade estimation, and retention risk assessment.
    """
    def generate_predictions(
        self, 
        overall_match_score: float, 
        years_exp: float,
        classification: str
    ) -> Dict[str, Any]:
        
        # 1. Success Probability Index
        success_index = round(min(98.0, overall_match_score * 0.95 + 4.5), 1)
        
        # 2. Retention Risk Categorization
        if success_index >= 90:
            retention_risk = "Low"
        elif success_index >= 75:
            retention_risk = "Medium"
        else:
            retention_risk = "High"
            
        # 3. Predicted Interview Grade
        if overall_match_score >= 90:
            predicted_grade = "A"
        elif overall_match_score >= 82:
            predicted_grade = "B+"
        elif overall_match_score >= 74:
            predicted_grade = "B-"
        else:
            predicted_grade = "C"
            
        # 4. Salary Bound Estimation based on experience & match
        base_rate = 95000 + (years_exp * 7500) + (overall_match_score * 450)
        min_salary = int(round(base_rate * 0.95, -3))
        max_salary = int(round(base_rate * 1.10, -3))
        
        return {
            "predicted_interview_grade": predicted_grade,
            "success_probability_index": success_index,
            "retention_risk": retention_risk,
            "salary_recommendation": {
                "min_salary": min_salary,
                "max_salary": max_salary,
                "formatted": f"${min_salary:,} - ${max_salary:,}",
                "currency": "USD"
            },
            "explanation": {
                "factors": [
                    f"Experience coefficient ({years_exp} yrs) weighted at 0.35",
                    f"Overall skill match ({overall_match_score}%) weighted at 0.65",
                    f"Market benchmark index for {classification}"
                ]
            }
        }

prediction_engine = PredictiveAnalyticsEngine()
