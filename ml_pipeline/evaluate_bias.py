import os
import json
import pandas as pd

def evaluate_model_fairness(dataset_path=None):
    """
    Evaluates model fairness and bias compliance (NYC Local Law 144).
    Calculates Selection Rates and Disparate Impact Ratios across demographic subgroups.
    """
    if dataset_path is None:
        dataset_path = os.path.join(os.path.dirname(__file__), "dataset", "recruitment_training_data.csv")
        
    df = pd.read_csv(dataset_path)
    
    # Define selection threshold (top 30% match score = selected)
    threshold = df["match_score"].quantile(0.70)
    df["is_selected"] = df["match_score"] >= threshold
    
    group_stats = {}
    for group, group_df in df.groupby("demographic_group"):
        total = len(group_df)
        selected = group_df["is_selected"].sum()
        selection_rate = selected / total if total > 0 else 0.0
        group_stats[group] = {
            "total_candidates": total,
            "selected_candidates": selected,
            "selection_rate": round(selection_rate, 4)
        }
        
    # Calculate Disparate Impact Ratio relative to highest selection rate group
    max_rate = max(g["selection_rate"] for g in group_stats.values())
    
    disparate_impact_ratios = {}
    passed_all = True
    for group, stats in group_stats.items():
        ratio = round(stats["selection_rate"] / max_rate, 4) if max_rate > 0 else 1.0
        disparate_impact_ratios[group] = ratio
        stats["disparate_impact_ratio"] = ratio
        if ratio < 0.80:
            passed_all = False
            
    min_ratio = min(disparate_impact_ratios.values())
    
    compliance_report = {
        "audit_standard": "NYC Local Law 144 AI Automated Employment Decision Tools (AEDT)",
        "model_version": "v3.5.2-prod",
        "overall_status": "PASSED" if passed_all else "NEEDS_CALIBRATION",
        "min_disparate_impact_ratio": min_ratio,
        "adverse_impact_threshold": 0.80,
        "group_breakdown": group_stats
    }
    
    # Convert numpy int64/float64 -> native Python types for JSON serialization
    import numpy as np
    def to_native(obj):
        if isinstance(obj, dict):
            return {k: to_native(v) for k, v in obj.items()}
        elif isinstance(obj, (np.integer,)):
            return int(obj)
        elif isinstance(obj, (np.floating,)):
            return float(obj)
        return obj

    compliance_report = to_native(compliance_report)

    output_path = os.path.join(os.path.dirname(__file__), "models", "fairness_audit_report.json")
    with open(output_path, "w") as f:
        json.dump(compliance_report, f, indent=2)
        
    print(f"[AUDIT] Fairness Audit Complete! Minimum Disparate Impact Ratio: {min_ratio:.3f} (Status: {compliance_report['overall_status']})")
    return compliance_report

if __name__ == "__main__":
    evaluate_model_fairness()
