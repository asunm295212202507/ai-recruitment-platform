import os
import joblib
import numpy as np
from typing import Dict, Any

# Path to the trained ML model in ml_pipeline
_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), 
    "..", "..", "..", 
    "ml_pipeline", "models", "salary_predictor.joblib"
)
_salary_model = None

def _get_salary_model():
    """Lazy-loads the trained ML model so import stays fast."""
    global _salary_model
    if _salary_model is None:
        if os.path.exists(_MODEL_PATH):
            try:
                _salary_model = joblib.load(_MODEL_PATH)
            except Exception as e:
                print(f"[Warning] Failed to load ML model at {_MODEL_PATH}: {e}")
        else:
            print(f"[Info] ML model not found at {_MODEL_PATH}. Using fallback formula.")
    return _salary_model


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
            
        # 4. Salary Bound Estimation - Loads trained ML model if available, otherwise falls back
        model = _get_salary_model()
        if model is not None:
            try:
                # Features in training: ["years_experience", "match_score"]
                # Pass as a pandas DataFrame with matching column names to avoid UserWarning
                import pandas as pd
                input_data = pd.DataFrame(
                    [[years_exp, overall_match_score]], 
                    columns=["years_experience", "match_score"]
                )
                point_estimate = model.predict(input_data)[0]
                min_salary = int(round(point_estimate * 0.95, -3))
                max_salary = int(round(point_estimate * 1.10, -3))
                model_used = "Trained GradientBoostingRegressor model (salary_predictor.joblib)"
            except Exception as e:
                print(f"[Warning] Error during model prediction: {e}. Falling back to formula.")
                model = None

        
        # Fallback formula if model is not trained or failed
        if model is None:
            base_rate = 95000 + (years_exp * 7500) + (overall_match_score * 450)
            min_salary = int(round(base_rate * 0.95, -3))
            max_salary = int(round(base_rate * 1.10, -3))
            model_used = "Baseline experience coefficient & skill match formula"
            
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
                    f"Experience coefficient ({years_exp} yrs) and skill match ({overall_match_score}%)",
                    f"Salary prediction source: {model_used}"
                ]
            }
        }

prediction_engine = PredictiveAnalyticsEngine()

