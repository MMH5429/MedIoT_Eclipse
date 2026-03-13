"""
MedIoT Shield — ML Pipeline
Healthcare IoT Security Monitoring System

Runs the full pipeline:
  Load data → Extract features → Train IF + XGBoost → Run CUSUM
  → Compute trust scores → Generate alerts
"""

import os
import sys
import time

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from preprocessing.feature_engineering import run_feature_engineering
from models.anomaly_model import train_isolation_forest
from models.xgboost_model import train_xgboost
from models.cusum_detector import run_cusum_detection, save_cusum_results
from scoring.trust_score import compute_trust_scores, save_trust_scores
from alerts.alert_engine import generate_alerts, save_alerts
from alerts.attack_overview import generate_attack_overview, save_attack_overview


def main():
    print("=" * 60)
    print("  MedIoT Shield — ML Pipeline")
    print("  Healthcare IoT Security Monitoring")
    print("=" * 60)

    start_time = time.time()

    # Paths
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    model_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')

    # Phase 1: Feature Engineering
    print("\n[Phase 1] Feature Engineering")
    print("-" * 40)
    features_df, timeseries_df = run_feature_engineering(
        data_dir=data_dir,
        output_dir=data_dir
    )

    # Phase 2: Isolation Forest (Unsupervised)
    print("\n[Phase 2] Isolation Forest")
    print("-" * 40)
    features_df, if_model, if_scaler = train_isolation_forest(
        features_df, model_dir=model_dir
    )

    # Phase 3: XGBoost Classifier (Supervised)
    print("\n[Phase 3] XGBoost Classifier")
    print("-" * 40)
    features_df, xgb_model, xgb_scaler, xgb_metrics = train_xgboost(
        features_df, model_dir=model_dir
    )

    # Phase 4: CUSUM Change-Point Detection (Temporal)
    print("\n[Phase 4] CUSUM Detection")
    print("-" * 40)
    cusum_df = run_cusum_detection(timeseries_df)
    save_cusum_results(cusum_df, output_dir=data_dir)

    # Phase 5: Trust Score Computation
    print("\n[Phase 5] Trust Score Engine")
    print("-" * 40)
    trust_df = compute_trust_scores(features_df, cusum_df)
    save_trust_scores(trust_df, output_dir=data_dir)

    # Phase 6: Alert Generation
    print("\n[Phase 6] Alert Engine")
    print("-" * 40)
    alerts = generate_alerts(trust_df, features_df, cusum_df)
    save_alerts(alerts, output_dir=data_dir)

    # Phase 7: Attack Overview
    print("\n[Phase 7] Attack Overview")
    print("-" * 40)
    narrative, overview = generate_attack_overview(timeseries_df, trust_df, cusum_df, alerts)
    save_attack_overview(overview, output_dir=data_dir)
    print(narrative)

    # Summary
    elapsed = time.time() - start_time
    status_counts = trust_df['status'].value_counts()
    healthy = status_counts.get('Healthy', 0)
    suspicious = status_counts.get('Suspicious', 0)
    alert_count = status_counts.get('ALERT', 0)

    print("\n" + "=" * 60)
    print("  Pipeline Complete!")
    print("=" * 60)
    print(f"  Time elapsed: {elapsed:.1f}s")
    print(f"  Devices analyzed: {len(trust_df)}")
    print(f"  Healthy: {healthy} | Suspicious: {suspicious} | ALERT: {alert_count}")
    print(f"  XGBoost accuracy: {xgb_metrics['accuracy']:.1%}")
    print(f"  XGBoost F1 score: {xgb_metrics['f1']:.1%}")
    print(f"  Alerts saved to data/alerts.json")
    print("=" * 60)


if __name__ == '__main__':
    main()
