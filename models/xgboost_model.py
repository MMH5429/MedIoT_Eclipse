"""
XGBoost supervised classifier for known attack pattern detection.
Trains on labeled dataset (benign vs malicious).

Uses temporal split with grouped cross-validation: trains on earlier
time windows and tests on later windows from all devices.  Additionally
runs Leave-One-Device-Out CV to report generalisation to unseen devices.
"""

import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sklearn.preprocessing import StandardScaler
import joblib
import os

FEATURE_COLS = [
    'bytes_sent', 'bytes_received', 'avg_bytes_sent', 'avg_bytes_received',
    'packet_count', 'avg_connection_duration', 'total_duration',
    'unique_dst_ips', 'unique_dst_ports', 'connection_count',
    'protocol_diversity', 'failed_connection_ratio', 'external_ip_ratio'
]


def _make_model(scale_pos_weight=1.0):
    """Shared model config — regularised for small dataset."""
    return XGBClassifier(
        n_estimators=50,
        max_depth=3,
        learning_rate=0.05,
        min_child_weight=5,
        subsample=0.7,
        colsample_bytree=0.7,
        reg_alpha=1.5,
        reg_lambda=4.0,
        gamma=0.5,
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        eval_metric='logloss',
        verbosity=0,
    )


def train_xgboost(features_df, model_dir='models'):
    """Train XGBoost with temporal holdout + LODO-CV evaluation."""
    print("\n--- XGBoost Classifier Training ---")

    features_df = features_df.sort_values(['source_ip', 'time_window']).reset_index(drop=True)
    X_all = features_df[FEATURE_COLS].values
    y_all = features_df['is_malicious'].values
    ips = features_df['source_ip'].values

    # ── Temporal holdout: first 50% → train, last 50% → test ──
    # Per-device split so every device contributes to both sets.
    train_idx, test_idx = [], []
    for ip, grp in features_df.groupby('source_ip'):
        n = len(grp)
        split = max(1, int(n * 0.50))
        train_idx.extend(grp.index[:split].tolist())
        test_idx.extend(grp.index[split:].tolist())

    train_mask = np.zeros(len(features_df), dtype=bool)
    test_mask = np.zeros(len(features_df), dtype=bool)
    train_mask[train_idx] = True
    test_mask[test_idx] = True

    # Devices with only 1 sample go to train only
    if test_mask.sum() == 0:
        train_mask[:] = True
        test_mask[:] = False

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_all)

    X_train, X_test = X_scaled[train_mask], X_scaled[test_mask]
    y_train, y_test = y_all[train_mask], y_all[test_mask]

    print(f"Temporal split (50/50 per device):")
    print(f"  Train: {train_mask.sum()} samples | Test: {test_mask.sum()} samples")
    print(f"  Malicious — Train: {y_train.sum()}/{len(y_train)} ({y_train.mean():.1%}) | "
          f"Test: {y_test.sum()}/{len(y_test)} ({y_test.mean():.1%})")

    spw = (y_train == 0).sum() / max((y_train == 1).sum(), 1)
    model = _make_model(scale_pos_weight=spw)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    metrics = {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1,
    }

    print(f"\nXGBoost Performance (temporal holdout):")
    print(f"  Accuracy:  {accuracy:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['Benign', 'Malicious'])}")

    # ── LODO-CV for reference ──────────────────────────────
    unique_ips = features_df['source_ip'].unique()
    lodo_true, lodo_pred = [], []
    for held_ip in unique_ips:
        tmask = ips != held_ip
        vmask = ips == held_ip
        if vmask.sum() == 0 or tmask.sum() == 0:
            continue
        if y_all[tmask].sum() == 0:
            continue
        sc = StandardScaler()
        Xtr = sc.fit_transform(X_all[tmask])
        Xte = sc.transform(X_all[vmask])
        ytr, yte = y_all[tmask], y_all[vmask]
        sw = (ytr == 0).sum() / max((ytr == 1).sum(), 1)
        m = _make_model(scale_pos_weight=sw)
        m.fit(Xtr, ytr)
        yp = m.predict(Xte)
        lodo_true.extend(yte.tolist())
        lodo_pred.extend(yp.tolist())

    lodo_acc = accuracy_score(lodo_true, lodo_pred)
    print(f"  LODO-CV accuracy (unseen devices): {lodo_acc:.4f}")

    # ── Train final model on ALL data ──────────────────────
    print(f"\nTraining final model on all {len(features_df)} samples...")
    spw_final = (y_all == 0).sum() / max((y_all == 1).sum(), 1)
    final_model = _make_model(scale_pos_weight=spw_final)
    final_model.fit(X_scaled, y_all)

    all_proba = final_model.predict_proba(X_scaled)[:, 1]
    features_df = features_df.copy()
    features_df['xgb_malicious_prob'] = all_proba

    # Feature importance
    importance = dict(zip(FEATURE_COLS, final_model.feature_importances_))
    print("\nTop features:")
    for feat, imp in sorted(importance.items(), key=lambda x: -x[1])[:5]:
        print(f"  {feat}: {imp:.4f}")

    # Save
    model_path = os.path.join(model_dir, 'xgboost_model.pkl')
    scaler_path = os.path.join(model_dir, 'xgb_scaler.pkl')
    joblib.dump(final_model, model_path)
    joblib.dump(scaler, scaler_path)
    print(f"Model saved to {model_path}")

    return features_df, final_model, scaler, metrics


if __name__ == '__main__':
    df = pd.read_csv('data/features.csv')
    result, _, _, metrics = train_xgboost(df)
    print(result[['device_id', 'xgb_malicious_prob']].head(10))
