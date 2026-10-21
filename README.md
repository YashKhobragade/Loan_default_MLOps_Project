# Loan Default Prediction Using Machine Learning — End-to-End MLOps Pipeline

An end-to-end MLOps pipeline and interactive screening workbench that transforms raw Home Equity (HMEQ) loan application data into a versioned, monitored, and self-retraining credit risk prediction service.

**Authors:** Aditya B Kale · Lavesh V Hasani · Yash S Khobragade  
**Course Project:** MLOps · 2026

---

## Executive Summary & Key Metrics

| Metric | Value | Description |
| :--- | :--- | :--- |
| **Dataset Size** | **5,960** | Home-equity loan applications (`4,768` train / `1,192` unseen test split) |
| **Input Schema** | **12 + 1** | 12 credit, demographic, and property features + binary target `BAD` |
| **Candidate Models** | **4** | Logistic Regression, Decision Tree, Bagging Classifier, Random Forest |
| **Grid-Search Experiments** | **48 Runs** | 5-fold stratified cross-validation tracked in MLflow & linked to DVC/Git |
| **Production Recall** | **0.79** | Flags **188 of 238** actual defaulters in the unseen test set (`±0.02` CV stability) |
| **Production ROC-AUC** | **0.95** | Best rank-ordering of high-risk vs. safe applicants across thresholds |
| **Business Impact** | **50% Reduction** | Cuts approved bad loans in half compared to the linear baseline (`50` vs. `100` missed defaulters) |
| **Serving Latency (p95)** | **42 ms** | FastAPI microservice packaged in a `410 MB` `python:3.11-slim` Docker image on AWS EC2 |

---

## 1. Business Problem & Objective

### Limitations of Manual Underwriting
1. **Inconsistent Feature Evaluation:** Manual review relies on simple rule-of-thumb heuristics that vary from officer to officer and miss non-linear multi-feature interactions.
2. **Slow & Unscalable Review Cycles:** Manual application checking creates approval bottlenecks for creditworthy borrowers while still letting borderline defaults slip through.
3. **Lack of Systematic Learning:** Historical repayment outcomes across thousands of prior loans are not systematically fed back into underwriting thresholds.

### Core Business Question
> *"Can we predict whether a borrower will default **before** the loan is approved?"*

Our objective is to deploy an automated, reproducible machine learning service that flags high-risk applicants early—cutting default losses by 50% while fast-tracking low-risk borrowers.

---

## 2. The HMEQ Dataset at a Glance

The **Home Equity (HMEQ)** dataset contains **5,960** home-equity loan applications with **12 input features** grouped across five credit domains and a binary target variable (`BAD`):

- **Class Distribution (Imbalanced Target):**
  - `BAD = 0` (Repaid): **4,771 loans (80.1%)**
  - `BAD = 1` (Defaulted): **1,189 loans (19.9%)**

| Domain Group | Feature | Type | Description | Missing Rate | Train Imputation Fill | RF Importance |
| :--- | :--- | :--- | :--- | ---: | :--- | ---: |
| **Affordability** | `DEBTINC` | Numeric | Debt-to-income ratio (%) | 21.3% | `34.8%` (Median) | `0.24` |
| **Credit History** | `DELINQ` | Numeric | Number of delinquent (late) credit lines | 9.7% | `0` (Median) | `0.15` |
| **Credit History** | `CLAGE` | Numeric | Age of oldest credit line in months | 5.2% | `173.5 mos` (Median) | `0.11` |
| **Credit Activity** | `NINQ` | Numeric | Number of recent credit inquiries | 8.6% | `1` (Median) | `0.08` |
| **Loan & Property** | `MORTDUE` | Numeric | Amount due on existing mortgage ($) | 8.7% | `$65,019` (Median) | `0.07` |
| **Credit History** | `DEROG` | Numeric | Number of major derogatory reports | 11.9% | `0` (Median) | `0.07` |
| **Loan & Property** | `LOAN` | Numeric | Requested home-equity loan amount ($) | 0.0% | `$16,300` (Complete) | `0.06` |
| **Loan & Property** | `VALUE` | Numeric | Current market value of property ($) | 1.9% | `$89,235` (Median) | `0.06` |
| **Credit Activity** | `CLNO` | Numeric | Total number of credit lines | 3.7% | `20` (Median) | `0.05` |
| **Applicant** | `YOJ` | Numeric | Years at present job | 8.6% | `7.0 yrs` (Median) | `0.05` |
| **Applicant** | `JOB` | Categorical | Occupational category (`ProfExe`, `Mgr`, `Office`, `Sales`, `Self`, `Other`) | 4.7% | `Other` (Mode) | `0.04` |
| **Applicant** | `REASON` | Categorical | Loan purpose (`DebtCon` = Consolidation, `HomeImp` = Home Improvement) | 4.2% | `DebtCon` (Mode) | `0.02` |
| **Target** | `BAD` | Binary | `1` = Defaulted, `0` = Repaid | 0.0% | Stratified target | — |

---

## 3. Exploratory Data Analysis (EDA) & Preprocessing Pipeline

### Key EDA Insights
- **Missingness Is Informative:** 11 of the 12 features contain missing values (`LOAN` is the only 100% complete column). `DEBTINC` is missing in **21.3%** of applications, and applicants with unreported `DEBTINC` default roughly **3× more often**.
- **Primary Default Drivers:** Prior delinquencies (`DELINQ`), major derogatory reports (`DEROG`), elevated debt-to-income ratios (`DEBTINC`), and short credit histories (`CLAGE`) exhibit the strongest separation between defaulters and repaid borrowers.
- **Why Recall Matters Over Raw Accuracy:** Because only ~1 in 5 loans defaults (`19.9%`), a naive majority-class classifier achieves `80.1%` accuracy while catching `0%` of defaulters. All hyperparameter tuning therefore optimizes **Recall on the default class (`BAD = 1`)** alongside **ROC-AUC**.

### `scikit-learn` Preprocessing Pipeline
1. **Median & Mode Imputation (`SimpleImputer`):** Numeric features with gaps (such as `DEBTINC`, `DEROG`, `DELINQ`) are imputed using the training split median; categorical columns (`REASON`, `JOB`) are imputed using the training mode.
2. **Stratified 80/20 Train/Test Split:** Preserves the exact `19.9%` default ratio across **4,768 training loans** and **1,192 unseen test loans**.
3. **One-Hot Encoding (`OneHotEncoder`):** Converts `REASON` and `JOB` into binary `1/0` indicator columns.
4. **Feature Standardization (`StandardScaler`):** Centers and scales numeric features (`z = (x - μ) / σ`) so large dollar amounts (`VALUE`, `MORTDUE`, `LOAN`) do not dominate smaller integer counts during linear and distance-sensitive modeling.

---

## 4. Candidate Models & Test-Set Evaluation

Four model architectures were trained using **5-fold stratified cross-validation** across **48 total grid-search runs**:

1. **`01 · BASELINE` — Logistic Regression:** Tuned `C` and `L2` penalty. Fast and interpretable, establishing the linear decision boundary baseline.
2. **`02 · RULES` — Decision Tree:** Tuned `max_depth` and `min_samples_leaf`. Mirrors credit-officer `if-then` rules but is prone to variance.
3. **`03 · ENSEMBLE` — Bagging Classifier:** Tuned `n_estimators` and `max_samples`. Averages bootstrapped decision trees to reduce variance.
4. **`04 · ENSEMBLE+` — Random Forest (Selected for Production):** Tuned `n_estimators=200`, `max_depth=14`, `max_features="sqrt"`. Decorrelates trees via random feature subsets for maximum generalization.

### Unseen Test Set Comparison (`1,192` Loans: `238` Defaulters, `954` Repaid)

| Model | Accuracy | Precision | Recall (Key) | F1-Score | ROC-AUC | CV Recall SD | Defaulters Caught (`TP`) | Bad Loans Approved (`FN`) |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **Logistic Regression** | 0.85 | 0.63 | 0.58 | 0.60 | 0.81 | ±0.03 | 138 / 238 | 100 |
| **Decision Tree** | 0.87 | 0.66 | 0.68 | 0.67 | 0.79 | ±0.05 | 162 / 238 | 76 |
| **Bagging Classifier** | 0.91 | 0.80 | 0.72 | 0.76 | 0.93 | ±0.03 | 171 / 238 | 67 |
| **Random Forest (Selected)** | **0.93** | **0.84** | **0.79** | **0.81** | **0.95** | **±0.02** | **188 / 238** | **50** |

### Top 5 Risk Factors (Random Forest Feature Importances)
1. **Debt-to-income (`DEBTINC`):** `0.24`
2. **Delinquencies (`DELINQ`):** `0.15`
3. **Credit age (`CLAGE`):** `0.11`
4. **Recent inquiries (`NINQ`):** `0.08`
5. **Mortgage owed (`MORTDUE`):** `0.07`

---

## 5. Experiment Tracking & Model Registry with MLflow

Every training run logs its hyperparameters, preprocessing configuration, random seed, Git commit SHA, DVC data hash, fold-level metrics, and serialized pipeline artifacts (`confusion_matrix.png`, `roc_curve.png`, `feature_importances.json`, `model.pkl`).

### Top 5 of 48 Runs (Sorted by Default Recall)

| Run Name | Model Family | Recall | ROC-AUC | Accuracy | F1-Score | Git Commit | DVC Data Version | Registry Stage |
| :--- | :--- | ---: | ---: | ---: | ---: | :--- | :--- | :--- |
| **`rf-tuned-07`** | **Random Forest** | **0.79** | **0.95** | **0.93** | **0.81** | `a8f3d21` | `hmeq-v2.4-sha91c` | **Production (`loan-default-rf v3`)** |
| `rf-baseline` | Random Forest | 0.74 | 0.94 | 0.91 | 0.78 | `7c4e109` | `hmeq-v2.4-sha91c` | Staging |
| `bag-tuned-03` | Bagging | 0.72 | 0.93 | 0.91 | 0.76 | `6b29a44` | `hmeq-v2.4-sha91c` | Archived |
| `dt-tuned-05` | Decision Tree | 0.68 | 0.79 | 0.87 | 0.67 | `3d91f88` | `hmeq-v2.3-sha40b` | Archived |
| `lr-tuned-02` | Logistic Reg. | 0.58 | 0.81 | 0.85 | 0.60 | `1e04c12` | `hmeq-v2.3-sha40b` | Archived |

---

## 6. End-to-End 10-Stage MLOps Pipeline & CI/CD

### 10-Stage Closed-Loop Architecture
1. **`01 · DATA` — Versioned Data:** Raw HMEQ CSV tracked with **DVC** and linked to Git commits.
2. **`02 · PREP` — Validate & Preprocess:** Schema, data-type, and value-range checks followed by the `scikit-learn` `Pipeline`.
3. **`03 · TRAIN` — Train & Tune:** 4 candidate model families evaluated via 5-fold stratified `GridSearchCV`.
4. **`04 · TRACK` — MLflow Tracking:** Logs parameters, fold metrics, and evaluation plots across all 48 runs.
5. **`05 · REGISTRY` — Model Registry:** Best candidate (`rf-tuned-07`) registered as `loan-default-rf v3` and transitioned `Staging → Production`.
6. **`06 · PACKAGE` — Docker Image:** Bundles serialized pipeline and FastAPI server into a `410 MB` `python:3.11-slim` container.
7. **`07 · SERVE` — FastAPI Service:** Exposes `POST /predict` and `GET /health` on **AWS EC2 (`t3.medium`)** with `42 ms` p95 latency.
8. **`08 · MONITOR` — Monitoring:** Weekly **Evidently** feature/prediction drift reports + **Prometheus & Grafana** latency/error dashboards.
9. **`09 · ALERT` — Drift Alert:** Fires when **PSI > 0.20** on a top-5 feature or monthly recall falls below **0.72**.
10. **`10 · RETRAIN` — Retrain Trigger:** Fresh labeled data loops back to Stage 01 via automated GitHub Actions execution.

### Continuous Integration & Continuous Delivery (GitHub Actions)
- **Continuous Integration (Every Push & Pull Request):**
  1. **Lint & Format:** `flake8` and `black` check code quality across all modules.
  2. **Unit Tests:** **34 `pytest` tests** verify preprocessing transformers, imputation edge cases, and FastAPI endpoints.
  3. **Data Validation:** Enforces column schema, data types, and numerical domain bounds.
- **Continuous Delivery (Merge to `main` or Drift Webhook):**
  4. **Retrain (`dvc repro`):** Re-executes only pipeline stages with modified data or code dependencies.
  5. **Automated Promotion Gate:**
     $$\text{Deploy Approved} \iff \left(\text{Recall}_{\text{candidate}} \ge \text{Recall}_{\text{production}}\right) \;\land\; \left(\text{ROC-AUC}_{\text{production}} - \text{ROC-AUC}_{\text{candidate}} \le 0.01\right)$$
  6. **Build & Push:** Builds and pushes the versioned Docker image to the container registry.
  7. **Deploy:** Performs a rolling container update on the AWS EC2 server (~9 minutes total pipeline runtime).

---

## 7. Serving Predictions with FastAPI

### Endpoint Contract (`POST /predict`)

**Example Request:**
```json
{
  "LOAN": 18000,
  "MORTDUE": 62000,
  "VALUE": 85000,
  "REASON": "DebtCon",
  "JOB": "Other",
  "YOJ": 2,
  "DEROG": 1,
  "DELINQ": 3,
  "CLAGE": 96,
  "NINQ": 4,
  "CLNO": 21,
  "DEBTINC": 44.5
}
```

**Example Response (`200 OK` · `42 ms` p95):**
```json
{
  "default_probability": 0.72,
  "risk_label": "High",
  "model_version": "loan-default-rf v3"
}
```

**Decision Risk Bands:**
- **Low Risk (`< 0.30`):** Eligible for automated fast-track approval.
- **Medium Risk (`0.30 – 0.60`):** Route to manual income & debt-to-income verification.
- **High Risk (`> 0.60`):** Flag for senior underwriter review / decline.

---

## 8. Monitoring, Drift Detection & Self-Retraining Simulation

| Monitoring Signal | Tool & Cadence | Alert Threshold | Automated Action |
| :--- | :--- | :--- | :--- |
| **Data Drift** | Evidently (Weekly) | `PSI > 0.20` on any Top-5 feature | Trigger alert + automated CI/CD retrain |
| **Prediction Drift** | Evidently (Weekly) | High-risk prediction share shifts `> 10 pts` | Flag pipeline for underwriting audit |
| **Model Quality** | Repayment Labels (Monthly) | Recall drops below `0.72` | Trigger automated CI/CD retrain |
| **Service Health** | Prometheus + Grafana (Real-time) | `p95 > 200 ms` or HTTP error rate `> 1%` | Page on-call engineer |

### Drift Simulation Benchmark
1. **Synthetic Cohort Shift:** Injecting a synthetic wave of higher-DTI borrowers shifts **3 of 12** features past the `PSI > 0.20` threshold (`DEBTINC` PSI = `0.34`, `DELINQ` PSI = `0.25`, `NINQ` PSI = `0.22`).
2. **Degradation Detection:** Unretrained model recall drops from `0.79` to **`0.70`** (breaching the `0.72` quality floor).
3. **Self-Retraining Recovery:** The drift alert triggers `dvc repro` and the GitHub Actions Promotion Gate, promoting `loan-default-rf v4` and restoring test recall to **`0.78`**.

---

## 9. Limitations & Future Scope

### Current Limitations
- **Dataset Scope:** The HMEQ dataset is relatively small (`5,960` loans) and reflects a single historical period and geographic region.
- **Heavy Missingness:** With 11 of 12 features containing gaps (`21.3%` missing in `DEBTINC`), median/mode imputation can smooth over subtle subgroup patterns.
- **Fairness Auditing:** Demographic parity and equalized odds across applicant job categories have not yet been formally audited.

### Future Scope
- Evaluate gradient-boosted trees (**XGBoost** and **LightGBM**) with isotonic probability calibration.
- Integrate per-applicant **SHAP** force values into the `/predict` response payload for local regulatory explainability.
- Add automated fairness gates, shadow A/B deployment routing, and managed **AWS SageMaker** autoscaling endpoints.

---

## 10. Local Setup, Testing & Build

### Prerequisites
- **Node.js** `>= 20.x` and **npm**

### Installation & Development Server
```bash
# Install dependencies
npm install

# Start the local development server on port 3000
npm run dev
```

### Running Unit Tests & Type Verification
```bash
# Run the MLOps engine unit test suite (preprocessing, inference, promotion gate, and PSI drift)
npx tsx --test src/utils/mlopsEngine.test.ts

# Run TypeScript compiler type-checking
npm run lint

# Build production bundle
npm run build
```

---

## Repository Structure

```text
├── public/
│   └── assets/                         # Project presentation slide deck PDF
├── src/
│   ├── components/
│   │   ├── ScreeningView.tsx           # Real-time 12-feature loan screener, FastAPI JSON & sklearn trace
│   │   ├── DatasetEdaView.tsx          # HMEQ dataset summary, missingness table & record explorer
│   │   ├── ModelsMlflowView.tsx        # 4-model test comparison, Confusion Matrix, MLflow runs & Promotion Gate
│   │   ├── DriftPipelineView.tsx       # Evidently PSI drift simulator, 10-stage MLOps diagram & CI/CD monitor
│   │   └── PresentationDeckModal.tsx   # Embedded 13-slide course presentation viewer
│   ├── data/
│   │   └── hmeqData.ts                 # HMEQ feature specs, MLflow experiment logs, model benchmarks & sample rows
│   ├── utils/
│   │   ├── mlopsEngine.ts              # Core preprocessing, inference, CI/CD promotion gate & PSI drift engine
│   │   └── mlopsEngine.test.ts         # Deterministic unit tests for all core MLOps calculations
│   ├── App.tsx                         # Main application layout and state orchestration
│   ├── index.css                       # Typography and styling configuration
│   └── main.tsx                        # Application entry point
├── index.html
├── package.json
└── tsconfig.json
```
