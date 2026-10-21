import { HmeqApplicantInput, ModelId, SLIDE_10_EXAMPLE_INPUT } from '../utils/mlopsEngine';

export interface ApplicantPreset {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  input: HmeqApplicantInput;
}

export const APPLICANT_PRESETS: ApplicantPreset[] = [
  {
    id: 'slide-10-canonical',
    name: 'Slide 10 FastAPI Payload (#4092)',
    subtitle: 'DebtCon · 3 delinquencies · 44.5% DTI → 0.72 High Risk',
    badge: 'Slide 10 Reference',
    input: { ...SLIDE_10_EXAMPLE_INPUT },
  },
  {
    id: 'prime-homeimp',
    name: 'Prime Home Improvement (#1048)',
    subtitle: 'HomeImp · ProfExe · 0 delinquencies · 24.2% DTI → Low Risk',
    badge: 'Low Risk Benchmark',
    input: {
      LOAN: 24500,
      MORTDUE: 78000,
      VALUE: 165000,
      REASON: 'HomeImp',
      JOB: 'ProfExe',
      YOJ: 14,
      DEROG: 0,
      DELINQ: 0,
      CLAGE: 248,
      NINQ: 0,
      CLNO: 19,
      DEBTINC: 24.2,
    },
  },
  {
    id: 'missing-debtinc-signal',
    name: 'Unreported DTI Signal (#2819)',
    subtitle: 'Missing DEBTINC (imputed 34.8%) · 3× Default Risk Signal (Slide 4)',
    badge: 'Missing Data Signal',
    input: {
      LOAN: 15200,
      MORTDUE: 54000,
      VALUE: 72000,
      REASON: 'DebtCon',
      JOB: 'Sales',
      YOJ: 3,
      DEROG: 0,
      DELINQ: 1,
      CLAGE: 112,
      NINQ: 3,
      CLNO: 16,
      DEBTINC: null,
    },
  },
  {
    id: 'borderline-medium',
    name: 'Borderline Consolidation (#3310)',
    subtitle: 'DebtCon · Mgr · 1 delinquency · 37.8% DTI → Medium Risk Review',
    badge: 'Manual Review Band',
    input: {
      LOAN: 21000,
      MORTDUE: 89000,
      VALUE: 122000,
      REASON: 'DebtCon',
      JOB: 'Mgr',
      YOJ: 6,
      DEROG: 0,
      DELINQ: 2,
      CLAGE: 142,
      NINQ: 2,
      CLNO: 24,
      DEBTINC: 37.8,
    },
  },
];

export interface HmeqFeatureSpec {
  group: string;
  feature: string;
  type: 'Numeric' | 'Categorical' | 'Target';
  description: string;
  missingPct: number;
  imputationStrategy: string;
  medianOrMode: string;
  importance: number;
}

export const HMEQ_FEATURE_SPECS: HmeqFeatureSpec[] = [
  {
    group: 'Affordability',
    feature: 'DEBTINC',
    type: 'Numeric',
    description: 'Debt-to-income ratio (%) — strongest predictor; missingness itself signals 3× higher default rate',
    missingPct: 21.3,
    imputationStrategy: 'Median + missingness indicator',
    medianOrMode: '34.8%',
    importance: 0.24,
  },
  {
    group: 'Credit history',
    feature: 'DELINQ',
    type: 'Numeric',
    description: 'Number of delinquent (late) credit lines',
    missingPct: 9.7,
    imputationStrategy: 'Median imputation',
    medianOrMode: '0 lines',
    importance: 0.15,
  },
  {
    group: 'Credit history',
    feature: 'CLAGE',
    type: 'Numeric',
    description: 'Age of oldest credit line in months',
    missingPct: 5.2,
    imputationStrategy: 'Median imputation',
    medianOrMode: '173.5 mos',
    importance: 0.11,
  },
  {
    group: 'Credit activity',
    feature: 'NINQ',
    type: 'Numeric',
    description: 'Number of recent credit inquiries',
    missingPct: 8.6,
    imputationStrategy: 'Median imputation',
    medianOrMode: '1 inquiry',
    importance: 0.08,
  },
  {
    group: 'Loan & property',
    feature: 'MORTDUE',
    type: 'Numeric',
    description: 'Amount due on existing mortgage ($)',
    missingPct: 8.7,
    imputationStrategy: 'Median imputation',
    medianOrMode: '$65,019',
    importance: 0.07,
  },
  {
    group: 'Credit history',
    feature: 'DEROG',
    type: 'Numeric',
    description: 'Number of major derogatory reports',
    missingPct: 11.9,
    imputationStrategy: 'Median imputation',
    medianOrMode: '0 reports',
    importance: 0.07,
  },
  {
    group: 'Loan & property',
    feature: 'LOAN',
    type: 'Numeric',
    description: 'Requested home-equity loan amount ($) — only feature with 0% missing values',
    missingPct: 0.0,
    imputationStrategy: 'Complete (no gaps)',
    medianOrMode: '$16,300',
    importance: 0.06,
  },
  {
    group: 'Loan & property',
    feature: 'VALUE',
    type: 'Numeric',
    description: 'Current market value of property ($)',
    missingPct: 1.9,
    imputationStrategy: 'Median imputation',
    medianOrMode: '$89,235',
    importance: 0.06,
  },
  {
    group: 'Credit activity',
    feature: 'CLNO',
    type: 'Numeric',
    description: 'Total number of credit lines',
    missingPct: 3.7,
    imputationStrategy: 'Median imputation',
    medianOrMode: '20 lines',
    importance: 0.05,
  },
  {
    group: 'Applicant',
    feature: 'YOJ',
    type: 'Numeric',
    description: 'Years at present job',
    missingPct: 8.6,
    imputationStrategy: 'Median imputation',
    medianOrMode: '7.0 yrs',
    importance: 0.05,
  },
  {
    group: 'Applicant',
    feature: 'JOB',
    type: 'Categorical',
    description: 'Occupational category (ProfExe, Mgr, Office, Sales, Self, Other)',
    missingPct: 4.7,
    imputationStrategy: 'Mode + One-Hot Encoding',
    medianOrMode: 'Other',
    importance: 0.04,
  },
  {
    group: 'Applicant',
    feature: 'REASON',
    type: 'Categorical',
    description: 'Loan purpose (DebtCon = Debt Consolidation, HomeImp = Home Improvement)',
    missingPct: 4.2,
    imputationStrategy: 'Mode + One-Hot Encoding',
    medianOrMode: 'DebtCon',
    importance: 0.02,
  },
];

export interface CandidateModelComparison {
  id: ModelId;
  code: string;
  tier: string;
  name: string;
  selected: boolean;
  description: string;
  tunedParams: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocAuc: number;
  cvStability: string;
  confusionMatrix: {
    tp: number; // Real defaulters caught (out of 238 in 1,192 test set)
    fn: number; // Real defaulters missed (bad loans approved)
    fp: number; // Good borrowers flagged
    tn: number; // Good borrowers approved (out of 954 in 1,192 test set)
  };
}

export const CANDIDATE_MODELS: CandidateModelComparison[] = [
  {
    id: 'logistic-regression',
    code: '01 · BASELINE',
    tier: 'Baseline Linear',
    name: 'Logistic Regression',
    selected: false,
    description: 'Simple, fast and explainable; shows how far a linear boundary can go.',
    tunedParams: 'C=1.0, penalty="l2", solver="lbfgs", class_weight="balanced"',
    accuracy: 0.85,
    precision: 0.63,
    recall: 0.58,
    f1: 0.60,
    rocAuc: 0.81,
    cvStability: '±0.03',
    confusionMatrix: {
      tp: 138,
      fn: 100, // Slide 12: "the logistic baseline let 100 defaulters through the test set"
      fp: 81,
      tn: 873,
    },
  },
  {
    id: 'decision-tree',
    code: '02 · RULES',
    tier: 'Single Tree',
    name: 'Decision Tree',
    selected: false,
    description: 'Learns if-then rules like a credit officer would, but overfits easily.',
    tunedParams: 'max_depth=8, min_samples_leaf=12, criterion="gini"',
    accuracy: 0.87,
    precision: 0.66,
    recall: 0.68,
    f1: 0.67,
    rocAuc: 0.79,
    cvStability: '±0.05',
    confusionMatrix: {
      tp: 162,
      fn: 76,
      fp: 83,
      tn: 871,
    },
  },
  {
    id: 'bagging',
    code: '03 · ENSEMBLE',
    tier: 'Bootstrap Ensemble',
    name: 'Bagging Classifier',
    selected: false,
    description: 'Averages many trees trained on bootstrapped samples to cut variance.',
    tunedParams: 'n_estimators=150, max_samples=0.85, bootstrap=True',
    accuracy: 0.91,
    precision: 0.80,
    recall: 0.72,
    f1: 0.76,
    rocAuc: 0.93,
    cvStability: '±0.03',
    confusionMatrix: {
      tp: 171,
      fn: 67,
      fp: 43,
      tn: 911,
    },
  },
  {
    id: 'rf-v3',
    code: '04 · ENSEMBLE+',
    tier: 'Production Selected',
    name: 'Random Forest (selected)',
    selected: true,
    description: 'Bagging plus random feature subsets, so trees are less correlated and more robust.',
    tunedParams: 'n_estimators=200, max_depth=14, max_features="sqrt"',
    accuracy: 0.93,
    precision: 0.84,
    recall: 0.79,
    f1: 0.81,
    rocAuc: 0.95,
    cvStability: '±0.02',
    confusionMatrix: {
      tp: 188, // Slide 7: "Flags 188 of the 238 real defaulters in the test set"
      fn: 50,  // Slide 12: "Random Forest lets only 50 through, half as many bad loans approved"
      fp: 36,
      tn: 918,
    },
  },
];

export interface MlflowRunRecord {
  runId: string;
  runName: string;
  modelFamily: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  rocAuc: number;
  stage: 'Production' | 'Staging' | 'Archived';
  gitCommit: string;
  dvcVersion: string;
  hyperparameters: string;
  durationSec: number;
  top5Slide6: boolean;
}

export const MLFLOW_EXPERIMENT_RUNS: MlflowRunRecord[] = [
  {
    runId: 'run-48-rf07',
    runName: 'rf-tuned-07',
    modelFamily: 'Random Forest',
    accuracy: 0.93,
    precision: 0.84,
    recall: 0.79,
    f1: 0.81,
    rocAuc: 0.95,
    stage: 'Production',
    gitCommit: 'a8f3d21',
    dvcVersion: 'hmeq-v2.4-sha91c',
    hyperparameters: 'n_estimators=200, max_depth=14, max_features="sqrt", class_weight="balanced_subsample"',
    durationSec: 18.4,
    top5Slide6: true,
  },
  {
    runId: 'run-39-rf01',
    runName: 'rf-baseline',
    modelFamily: 'Random Forest',
    accuracy: 0.91,
    precision: 0.82,
    recall: 0.74,
    f1: 0.78,
    rocAuc: 0.94,
    stage: 'Staging',
    gitCommit: '7c4e109',
    dvcVersion: 'hmeq-v2.4-sha91c',
    hyperparameters: 'n_estimators=100, max_depth=None, max_features="sqrt"',
    durationSec: 11.2,
    top5Slide6: true,
  },
  {
    runId: 'run-31-bag03',
    runName: 'bag-tuned-03',
    modelFamily: 'Bagging',
    accuracy: 0.91,
    precision: 0.80,
    recall: 0.72,
    f1: 0.76,
    rocAuc: 0.93,
    stage: 'Archived',
    gitCommit: '6b29a44',
    dvcVersion: 'hmeq-v2.4-sha91c',
    hyperparameters: 'n_estimators=150, max_samples=0.85, max_features=1.0',
    durationSec: 14.7,
    top5Slide6: true,
  },
  {
    runId: 'run-19-dt05',
    runName: 'dt-tuned-05',
    modelFamily: 'Decision Tree',
    accuracy: 0.87,
    precision: 0.66,
    recall: 0.68,
    f1: 0.67,
    rocAuc: 0.79,
    stage: 'Archived',
    gitCommit: '3d91f88',
    dvcVersion: 'hmeq-v2.3-sha40b',
    hyperparameters: 'max_depth=8, min_samples_leaf=12, criterion="gini"',
    durationSec: 2.1,
    top5Slide6: true,
  },
  {
    runId: 'run-08-lr02',
    runName: 'lr-tuned-02',
    modelFamily: 'Logistic Reg.',
    accuracy: 0.85,
    precision: 0.63,
    recall: 0.58,
    f1: 0.60,
    rocAuc: 0.81,
    stage: 'Archived',
    gitCommit: '1e04c12',
    dvcVersion: 'hmeq-v2.3-sha40b',
    hyperparameters: 'C=1.0, penalty="l2", solver="lbfgs"',
    durationSec: 1.4,
    top5Slide6: true,
  },
  {
    runId: 'run-44-rf05',
    runName: 'rf-tuned-05',
    modelFamily: 'Random Forest',
    accuracy: 0.92,
    precision: 0.83,
    recall: 0.77,
    f1: 0.80,
    rocAuc: 0.94,
    stage: 'Archived',
    gitCommit: '9f11b02',
    dvcVersion: 'hmeq-v2.4-sha91c',
    hyperparameters: 'n_estimators=150, max_depth=12, max_features="log2"',
    durationSec: 15.1,
    top5Slide6: false,
  },
  {
    runId: 'run-27-bag01',
    runName: 'bag-baseline',
    modelFamily: 'Bagging',
    accuracy: 0.89,
    precision: 0.77,
    recall: 0.69,
    f1: 0.73,
    rocAuc: 0.91,
    stage: 'Archived',
    gitCommit: '5a72e19',
    dvcVersion: 'hmeq-v2.4-sha91c',
    hyperparameters: 'n_estimators=50, max_samples=1.0',
    durationSec: 6.8,
    top5Slide6: false,
  },
  {
    runId: 'run-14-dt02',
    runName: 'dt-overfit-raw',
    modelFamily: 'Decision Tree',
    accuracy: 0.84,
    precision: 0.61,
    recall: 0.63,
    f1: 0.62,
    rocAuc: 0.74,
    stage: 'Archived',
    gitCommit: '2c88d01',
    dvcVersion: 'hmeq-v2.3-sha40b',
    hyperparameters: 'max_depth=None, min_samples_leaf=1',
    durationSec: 1.9,
    top5Slide6: false,
  },
];

export interface PipelineStageSpec {
  step: string;
  phase: 'Build' | 'Serve' | 'Retrain Loop';
  title: string;
  tool: string;
  detail: string;
  artifactOrEndpoint: string;
}

export const MLOPS_PIPELINE_STAGES: PipelineStageSpec[] = [
  {
    step: '01 · DATA',
    phase: 'Build',
    title: 'Versioned data',
    tool: 'DVC + Git',
    detail: 'HMEQ CSV (5,960 records) tracked with DVC remote storage',
    artifactOrEndpoint: 'data/hmeq.csv.dvc',
  },
  {
    step: '02 · PREP',
    phase: 'Build',
    title: 'Validate & preprocess',
    tool: 'scikit-learn Pipeline',
    detail: 'Schema checks + Median/Mode imputation + One-Hot + StandardScaler + Stratified 80/20 split',
    artifactOrEndpoint: 'src/preprocess.py',
  },
  {
    step: '03 · TRAIN',
    phase: 'Build',
    title: 'Train & tune',
    tool: 'GridSearchCV',
    detail: '4 candidate models, 5-fold stratified CV, 48 grid-search runs optimised for recall',
    artifactOrEndpoint: 'src/train.py',
  },
  {
    step: '04 · TRACK',
    phase: 'Build',
    title: 'MLflow tracking',
    tool: 'MLflow Tracking',
    detail: 'Logs parameters, fold metrics, confusion matrix, ROC curve, and feature importances',
    artifactOrEndpoint: 'mlruns/48-runs',
  },
  {
    step: '05 · REGISTRY',
    phase: 'Build',
    title: 'Model registry',
    tool: 'MLflow Registry',
    detail: 'Best run rf-tuned-07 registered as loan-default-rf v3, promoted Staging → Production',
    artifactOrEndpoint: 'models:/loan-default-rf/3',
  },
  {
    step: '06 · PACKAGE',
    phase: 'Serve',
    title: 'Docker image',
    tool: 'Docker (python:3.11-slim)',
    detail: 'Serialized sklearn Pipeline + FastAPI packaged in a reproducible 410 MB container',
    artifactOrEndpoint: 'ghcr.io/mlops/hmeq-rf:v3',
  },
  {
    step: '07 · SERVE',
    phase: 'Serve',
    title: 'FastAPI service',
    tool: 'FastAPI on AWS EC2',
    detail: 'POST /predict & GET /health on AWS EC2 t3.medium with 42 ms p95 latency',
    artifactOrEndpoint: 'POST /api/predict',
  },
  {
    step: '08 · MONITOR',
    phase: 'Serve',
    title: 'Monitoring',
    tool: 'Evidently + Prometheus/Grafana',
    detail: 'Weekly feature & prediction drift reports + real-time p95 latency & error rate telemetry',
    artifactOrEndpoint: 'reports/evidently_weekly.json',
  },
  {
    step: '09 · ALERT',
    phase: 'Retrain Loop',
    title: 'Drift alert',
    tool: 'Evidently Alert Hook',
    detail: 'Fires when PSI > 0.20 on a top-5 feature or monthly recall drops below 0.72',
    artifactOrEndpoint: 'webhook/drift-alert',
  },
  {
    step: '10 · RETRAIN',
    phase: 'Retrain Loop',
    title: 'Retrain trigger',
    tool: 'GitHub Actions + dvc repro',
    detail: 'Fresh labeled cohort loops back to Step 01, reruns dvc repro, and checks Promotion Gate',
    artifactOrEndpoint: '.github/workflows/mlops.yml',
  },
];

export interface SampleHmeqRecord {
  recordId: string;
  BAD: 0 | 1;
  LOAN: number;
  MORTDUE: number | null;
  VALUE: number | null;
  REASON: 'DebtCon' | 'HomeImp' | null;
  JOB: 'ProfExe' | 'Mgr' | 'Office' | 'Sales' | 'Self' | 'Other' | null;
  YOJ: number | null;
  DEROG: number | null;
  DELINQ: number | null;
  CLAGE: number | null;
  NINQ: number | null;
  CLNO: number | null;
  DEBTINC: number | null;
}

export const SAMPLE_HMEQ_RECORDS: SampleHmeqRecord[] = [
  {
    recordId: 'HMEQ-4092',
    BAD: 1,
    LOAN: 18000,
    MORTDUE: 62000,
    VALUE: 85000,
    REASON: 'DebtCon',
    JOB: 'Other',
    YOJ: 2,
    DEROG: 1,
    DELINQ: 3,
    CLAGE: 96,
    NINQ: 4,
    CLNO: 21,
    DEBTINC: 44.5,
  },
  {
    recordId: 'HMEQ-1048',
    BAD: 0,
    LOAN: 24500,
    MORTDUE: 78000,
    VALUE: 165000,
    REASON: 'HomeImp',
    JOB: 'ProfExe',
    YOJ: 14,
    DEROG: 0,
    DELINQ: 0,
    CLAGE: 248,
    NINQ: 0,
    CLNO: 19,
    DEBTINC: 24.2,
  },
  {
    recordId: 'HMEQ-2819',
    BAD: 1,
    LOAN: 15200,
    MORTDUE: 54000,
    VALUE: 72000,
    REASON: 'DebtCon',
    JOB: 'Sales',
    YOJ: 3,
    DEROG: 0,
    DELINQ: 1,
    CLAGE: 112,
    NINQ: 3,
    CLNO: 16,
    DEBTINC: null,
  },
  {
    recordId: 'HMEQ-3310',
    BAD: 0,
    LOAN: 21000,
    MORTDUE: 89000,
    VALUE: 122000,
    REASON: 'DebtCon',
    JOB: 'Mgr',
    YOJ: 6,
    DEROG: 0,
    DELINQ: 2,
    CLAGE: 142,
    NINQ: 2,
    CLNO: 24,
    DEBTINC: 37.8,
  },
  {
    recordId: 'HMEQ-0512',
    BAD: 0,
    LOAN: 12800,
    MORTDUE: 48500,
    VALUE: 94000,
    REASON: 'HomeImp',
    JOB: 'Office',
    YOJ: 9,
    DEROG: 0,
    DELINQ: 0,
    CLAGE: 198,
    NINQ: 1,
    CLNO: 15,
    DEBTINC: 29.1,
  },
  {
    recordId: 'HMEQ-5104',
    BAD: 1,
    LOAN: 28000,
    MORTDUE: 96000,
    VALUE: 112000,
    REASON: 'DebtCon',
    JOB: 'Self',
    YOJ: 1,
    DEROG: 2,
    DELINQ: 4,
    CLAGE: 74,
    NINQ: 6,
    CLNO: 28,
    DEBTINC: null,
  },
  {
    recordId: 'HMEQ-1984',
    BAD: 0,
    LOAN: 32000,
    MORTDUE: 115000,
    VALUE: 210000,
    REASON: 'DebtCon',
    JOB: 'ProfExe',
    YOJ: 18,
    DEROG: 0,
    DELINQ: 0,
    CLAGE: 310,
    NINQ: 0,
    CLNO: 26,
    DEBTINC: 31.4,
  },
  {
    recordId: 'HMEQ-4721',
    BAD: 1,
    LOAN: 10500,
    MORTDUE: 39000,
    VALUE: 51000,
    REASON: 'DebtCon',
    JOB: 'Other',
    YOJ: 2,
    DEROG: 1,
    DELINQ: 2,
    CLAGE: 88,
    NINQ: 3,
    CLNO: 14,
    DEBTINC: 46.8,
  },
];

export const PRESENTATION_SLIDES = [
  { slide: 1, title: 'Loan Default Prediction Using Machine Learning', summary: '5,960 loan records · 4 models compared · 10 MLOps tools integrated · 0.95 final ROC-AUC. Presented by Aditya B Kale, Lavesh V Hasani, Yash S Khobragade.' },
  { slide: 2, title: 'Current Problem with Detecting Loan Default', summary: 'Manual officer review misses complex multi-feature interactions, is slow to scale, and fails to learn systematically from historical repayment records.' },
  { slide: 3, title: 'The HMEQ Dataset at a Glance', summary: '5,960 home-equity loan applications across 12 input features + target BAD. Imbalanced target: 4,771 repaid (80.1%) vs 1,189 defaulted (19.9%).' },
  { slide: 4, title: 'EDA Findings and Preprocessing', summary: '11 of 12 features have missing gaps (DEBTINC missing 21.3%, defaulting 3× more often). Pipeline: Median/Mode imputation, Stratified 80/20 split (4,768 / 1,192), One-Hot Encoding, StandardScaler.' },
  { slide: 5, title: 'Training Four Candidate Models', summary: '01 Logistic Regression, 02 Decision Tree, 03 Bagging Classifier, 04 Random Forest. 5-fold stratified CV across 48 grid-search runs optimised for recall on the default class.' },
  { slide: 6, title: 'Experiment Tracking with MLflow', summary: 'Tracks parameters, fold/test metrics, and artifacts. Best run rf-tuned-07 (Recall 0.79, ROC-AUC 0.95) registered as loan-default-rf v3 and promoted Staging → Production.' },
  { slide: 7, title: 'Comparing Models on the Test Set (1,192 Unseen Loans)', summary: 'Random Forest achieves 0.93 Accuracy, 0.84 Precision, 0.79 Recall (flags 188 of 238 real defaulters), 0.81 F1, 0.95 ROC-AUC, and ±0.02 CV stability.' },
  { slide: 8, title: 'End-to-End MLOps Pipeline', summary: '10 automated stages from DVC data versioning, sklearn prep, training, MLflow tracking & registry, Docker packaging, FastAPI serving on AWS EC2, Evidently monitoring, drift alerting, and retrain loop.' },
  { slide: 9, title: 'CI/CD with GitHub Actions', summary: 'CI runs flake8/black, 34 pytest unit tests, and schema validation. CD runs dvc repro, enforces Promotion Gate (recall ≥ prod and ROC-AUC drop ≤ 0.01), pushes Docker image, and deploys to EC2.' },
  { slide: 10, title: 'Serving Predictions with FastAPI', summary: 'POST /predict returns default_probability, risk_label (Low <0.30, Medium 0.30–0.60, High >0.60), and model_version with 42 ms p95 latency in a 410 MB python:3.11-slim container.' },
  { slide: 11, title: 'Monitoring and Drift Detection', summary: 'Weekly Evidently PSI monitoring + monthly recall checks. Synthetic high-DEBTINC drift simulation flags 3 of 12 features (PSI > 0.2), drops recall to 0.70, and auto-retrains back to 0.78.' },
  { slide: 12, title: 'Results and Business Impact', summary: 'Top 5 risk factors: Debt-to-income (0.24), Delinquencies (0.15), Credit age (0.11), Recent inquiries (0.08), Mortgage owed (0.07). Cuts bad loans approved in half (from 100 to 50).' },
  { slide: 13, title: 'Conclusion and Future Scope', summary: 'Reproducible self-maintaining service. Future scope: XGBoost/LightGBM with probability calibration, per-decision SHAP explanations, fairness auditing, and AWS SageMaker deployment.' },
];
