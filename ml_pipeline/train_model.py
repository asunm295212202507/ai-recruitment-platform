import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.metrics import accuracy_score, mean_squared_error, r2_score

def train_recruitment_models(dataset_path=None):
    """
    Trains production Machine Learning models for:
    1. Resume Category Classification (Random Forest)
    2. Candidate Match Score & Ranking (Gradient Boosting Regressor)
    3. Salary & Success Index Predictor (Gradient Boosting Regressor)
    Exports model artifacts to ml_pipeline/models/
    """
    if dataset_path is None:
        dataset_path = os.path.join(os.path.dirname(__file__), "dataset", "recruitment_training_data.csv")
        
    if not os.path.exists(dataset_path):
        from ml_pipeline.generate_dataset import generate_recruitment_dataset
        dataset_path = generate_recruitment_dataset()
        
    print(f"[LOAD] Loading training dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)
    
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    
    # ----------------------------------------------------
    # Model 1: Resume Classification (Category Classifier)
    # ----------------------------------------------------
    print("[TRAIN] Training Model 1: Resume Category Classifier...")
    vectorizer = TfidfVectorizer(max_features=500, stop_words="english")
    X_text = vectorizer.fit_transform(df["resume_text_snippet"])
    y_cat = df["category"]
    
    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(X_text, y_cat, test_size=0.2, random_state=42)
    cat_model = RandomForestClassifier(n_estimators=100, random_state=42)
    cat_model.fit(X_train_c, y_train_c)
    cat_acc = accuracy_score(y_test_c, cat_model.predict(X_test_c))
    print(f"   Accuracy: {cat_acc * 100:.2f}%")
    
    # ----------------------------------------------------
    # Model 2: Candidate Match & Ranking Regressor
    # ----------------------------------------------------
    print("[TRAIN] Training Model 2: Candidate-to-Job Match Score Regressor...")
    X_match = df[["years_experience", "matched_skills_count"]]
    y_match = df["match_score"]
    
    X_train_m, X_test_m, y_train_m, y_test_m = train_test_split(X_match, y_match, test_size=0.2, random_state=42)
    match_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
    match_model.fit(X_train_m, y_train_m)
    
    y_pred_m = match_model.predict(X_test_m)
    match_rmse = np.sqrt(mean_squared_error(y_test_m, y_pred_m))
    match_r2 = r2_score(y_test_m, y_pred_m)
    print(f"   RMSE: {match_rmse:.2f}, R² Score: {match_r2:.4f}")
    
    # ----------------------------------------------------
    # Model 3: Salary Bound Predictor
    # ----------------------------------------------------
    print("[TRAIN] Training Model 3: Salary Recommendation Predictor...")
    X_sal = df[["years_experience", "match_score"]]
    y_sal = df["target_salary"]
    
    X_train_s, X_test_s, y_train_s, y_test_s = train_test_split(X_sal, y_sal, test_size=0.2, random_state=42)
    sal_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
    sal_model.fit(X_train_s, y_train_s)
    
    y_pred_s = sal_model.predict(X_test_s)
    sal_rmse = np.sqrt(mean_squared_error(y_test_s, y_pred_s))
    sal_r2 = r2_score(y_test_s, y_pred_s)
    print(f"   RMSE: ${sal_rmse:,.2f}, R² Score: {sal_r2:.4f}")
    
    # Save Model Artifacts
    joblib.dump(vectorizer, os.path.join(models_dir, "tfidf_vectorizer.joblib"))
    joblib.dump(cat_model, os.path.join(models_dir, "category_classifier.joblib"))
    joblib.dump(match_model, os.path.join(models_dir, "match_ranker.joblib"))
    joblib.dump(sal_model, os.path.join(models_dir, "salary_predictor.joblib"))
    
    metrics_report = {
        "status": "trained",
        "timestamp": pd.Timestamp.now().isoformat(),
        "total_training_samples": len(df),
        "models": {
            "category_classifier": {"accuracy": round(float(cat_acc), 4)},
            "match_ranker": {"rmse": round(float(match_rmse), 4), "r2_score": round(float(match_r2), 4)},
            "salary_predictor": {"rmse": round(float(sal_rmse), 4), "r2_score": round(float(sal_r2), 4)}
        },
        "artifacts_directory": models_dir
    }
    
    metrics_path = os.path.join(models_dir, "training_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics_report, f, indent=2)
        
    print(f"[SAVE] Model training complete! Artifacts saved to: {models_dir}")
    return metrics_report

if __name__ == "__main__":
    train_recruitment_models()
