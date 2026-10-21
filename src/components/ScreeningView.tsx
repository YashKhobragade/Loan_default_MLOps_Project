import React, { useState } from 'react';
import {
  HmeqApplicantInput,
  JobCategory,
  LoanReason,
  ModelId,
  PredictionResponse,
  SLIDE_10_EXAMPLE_INPUT,
  predictLoanDefault,
  validateApplicantInput,
} from '../utils/mlopsEngine';
import { APPLICANT_PRESETS } from '../data/hmeqData';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Play,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Terminal,
  Cpu,
} from 'lucide-react';

export interface ScreeningLogEntry {
  id: string;
  timestamp: string;
  applicantLabel: string;
  loanAmount: number;
  debtIncDisplay: string;
  delinq: number;
  modelVersion: string;
  probability: number;
  riskLabel: 'Low' | 'Medium' | 'High';
}

interface ScreeningViewProps {
  applicant: HmeqApplicantInput;
  onChangeApplicant: (next: HmeqApplicantInput) => void;
  selectedModel: ModelId;
  onSelectModel: (model: ModelId) => void;
  prediction: PredictionResponse;
  onRunPrediction: (customInput?: HmeqApplicantInput, label?: string) => void;
  auditLog: ScreeningLogEntry[];
}

export const ScreeningView: React.FC<ScreeningViewProps> = ({
  applicant,
  onChangeApplicant,
  selectedModel,
  onSelectModel,
  prediction,
  onRunPrediction,
  auditLog,
}) => {
  const [inspectorTab, setInspectorTab] = useState<'contributions' | 'fastapi' | 'preprocessing'>('contributions');
  const [copiedJson, setCopiedJson] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [activePresetId, setActivePresetId] = useState<string>('slide-10-canonical');

  const handleNumericChange = (field: keyof HmeqApplicantInput, rawValue: string) => {
    if (rawValue.trim() === '') {
      const next = { ...applicant, [field]: null };
      onChangeApplicant(next);
      return;
    }
    const parsed = Number(rawValue);
    const next = { ...applicant, [field]: parsed };
    onChangeApplicant(next);
    const check = validateApplicantInput(next);
    setValidationErrors(check.errors);
  };

  const handleSelectPreset = (presetId: string) => {
    const found = APPLICANT_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setActivePresetId(presetId);
    setValidationErrors({});
    onChangeApplicant({ ...found.input });
    onRunPrediction({ ...found.input }, found.name);
  };

  const handleResetSlide10 = () => {
    setActivePresetId('slide-10-canonical');
    setValidationErrors({});
    onChangeApplicant({ ...SLIDE_10_EXAMPLE_INPUT });
    onRunPrediction({ ...SLIDE_10_EXAMPLE_INPUT }, 'Slide 10 FastAPI Payload (#4092)');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateApplicantInput(applicant);
    setValidationErrors(check.errors);
    if (!check.valid) return;
    onRunPrediction(applicant, 'Custom Screened Applicant');
  };

  const fastApiRequestJson = JSON.stringify(
    {
      LOAN: applicant.LOAN,
      MORTDUE: applicant.MORTDUE,
      VALUE: applicant.VALUE,
      REASON: applicant.REASON,
      JOB: applicant.JOB,
      YOJ: applicant.YOJ,
      DEROG: applicant.DEROG,
      DELINQ: applicant.DELINQ,
      CLAGE: applicant.CLAGE,
      NINQ: applicant.NINQ,
      CLNO: applicant.CLNO,
      DEBTINC: applicant.DEBTINC,
    },
    null,
    2
  );

  const fastApiResponseJson = JSON.stringify(
    {
      default_probability: prediction.default_probability,
      risk_label: prediction.risk_label,
      model_version: prediction.model_version,
    },
    null,
    2
  );

  const handleCopyPayload = () => {
    const combined = `// POST /predict\n${fastApiRequestJson}\n\n// RESPONSE\n${fastApiResponseJson}`;
    navigator.clipboard?.writeText(combined).catch(() => {});
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1800);
  };

  const riskColorClasses =
    prediction.risk_label === 'High'
      ? {
          bg: 'bg-[#FEF2F2]',
          border: 'border-[#FECACA]',
          text: 'text-[#B91C1C]',
          bar: 'bg-[#DC2626]',
          icon: <ShieldAlert className="w-5 h-5 text-[#DC2626] shrink-0" />,
        }
      : prediction.risk_label === 'Medium'
      ? {
          bg: 'bg-[#FFFBEB]',
          border: 'border-[#FDE68A]',
          text: 'text-[#B45309]',
          bar: 'bg-[#D97706]',
          icon: <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />,
        }
      : {
          bg: 'bg-[#F0FDF4]',
          border: 'border-[#BBF7D0]',
          text: 'text-[#15803D]',
          bar: 'bg-[#16A34A]',
          icon: <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />,
        };

  return (
    <div className="space-y-8">
      {/* Top Scenario & Model Bar */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-[#0F1E36]">
              Real-Time Loan Default Screening &amp; FastAPI Service
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Screen home-equity loan applicants across all 12 HMEQ features before approval. Risk bands: Low (&lt;0.30) · Medium (0.30–0.60) · High (&gt;0.60).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="active-model-select" className="text-xs font-semibold text-slate-600">
              Serving Model:
            </label>
            <select
              id="active-model-select"
              value={selectedModel}
              onChange={(e) => onSelectModel(e.target.value as ModelId)}
              className="text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-[#0F1E36] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            >
              <option value="rf-v3">Random Forest · loan-default-rf v3 (Production · 0.79 Recall)</option>
              <option value="rf-v4">Random Forest · loan-default-rf v4 (Drift Retrained · 0.78 Recall)</option>
              <option value="bagging">Bagging Classifier · bag-tuned-03 (0.72 Recall)</option>
              <option value="decision-tree">Decision Tree · dt-tuned-05 (0.68 Recall)</option>
              <option value="logistic-regression">Logistic Regression · lr-tuned-02 (0.58 Recall)</option>
            </select>
          </div>
        </div>

        {/* Preset Benchmark Buttons */}
        <div className="mt-4">
          <div className="text-xs font-medium text-slate-500 mb-2.5">
            Load Benchmark Applicant Profile:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {APPLICANT_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-[#0F1E36] text-white border-[#0F1E36]'
                      : 'bg-slate-50/70 hover:bg-slate-100 text-[#0F1E36] border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate">{preset.name}</span>
                  </div>
                  <p
                    className={`text-[11px] mt-1 line-clamp-1 ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {preset.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main 2-Column Screener Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 12-Feature HMEQ Input Form (7 cols) */}
        <form
          onSubmit={handleFormSubmit}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6"
          aria-label="HMEQ Loan Application Features"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-[#0F1E36]">
                Applicant Feature Vector (12 HMEQ Inputs)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Missing numeric fields impute to training median; missing categorical fields impute to training mode.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetSlide10}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Slide 10 Payload
            </button>
          </div>

          {Object.keys(validationErrors).length > 0 && (
            <div
              role="alert"
              className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#B91C1C] space-y-1"
            >
              <div className="font-semibold">Schema Validation Failed (Step 02 Prep Check):</div>
              <ul className="list-disc pl-4 space-y-0.5">
                {Object.entries(validationErrors).map(([key, msg]) => (
                  <li key={key}>
                    <span className="font-mono font-semibold">{key}</span>: {msg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Group 1: Loan & Property */}
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-3">
              01. Loan &amp; Property Valuation (LOAN · MORTDUE · VALUE)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="input-LOAN" className="block text-xs font-medium text-slate-700 mb-1">
                  LOAN — Requested ($)
                </label>
                <input
                  id="input-LOAN"
                  type="number"
                  step="500"
                  value={applicant.LOAN ?? ''}
                  onChange={(e) => handleNumericChange('LOAN', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label htmlFor="input-MORTDUE" className="block text-xs font-medium text-slate-700 mb-1">
                  MORTDUE — Mortgage Due ($)
                </label>
                <input
                  id="input-MORTDUE"
                  type="number"
                  step="1000"
                  value={applicant.MORTDUE ?? ''}
                  onChange={(e) => handleNumericChange('MORTDUE', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label htmlFor="input-VALUE" className="block text-xs font-medium text-slate-700 mb-1">
                  VALUE — Home Value ($)
                </label>
                <input
                  id="input-VALUE"
                  type="number"
                  step="1000"
                  value={applicant.VALUE ?? ''}
                  onChange={(e) => handleNumericChange('VALUE', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>
          </div>

          {/* Group 2: Affordability & Credit History */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500">
                02. Affordability &amp; Credit History (DEBTINC · DELINQ · DEROG · CLAGE)
              </span>
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applicant.DEBTINC === null}
                  onChange={(e) => {
                    const next = {
                      ...applicant,
                      DEBTINC: e.target.checked ? null : 44.5,
                    };
                    onChangeApplicant(next);
                  }}
                  className="rounded border-slate-300 text-[#0D9488] focus:ring-[#0D9488]"
                />
                <span>Simulate Missing DEBTINC (21.3% of HMEQ · 3× Default Signal)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label htmlFor="input-DEBTINC" className="block text-xs font-medium text-slate-700 mb-1">
                  DEBTINC — DTI Ratio (%)
                </label>
                <input
                  id="input-DEBTINC"
                  type="number"
                  step="0.5"
                  placeholder="Missing → 34.8%"
                  disabled={applicant.DEBTINC === null}
                  value={applicant.DEBTINC ?? ''}
                  onChange={(e) => handleNumericChange('DEBTINC', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg disabled:bg-amber-50/60 disabled:text-amber-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label htmlFor="input-DELINQ" className="block text-xs font-medium text-slate-700 mb-1">
                  DELINQ — Late Lines
                </label>
                <input
                  id="input-DELINQ"
                  type="number"
                  min="0"
                  max="25"
                  value={applicant.DELINQ ?? ''}
                  onChange={(e) => handleNumericChange('DELINQ', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label htmlFor="input-DEROG" className="block text-xs font-medium text-slate-700 mb-1">
                  DEROG — Bad Marks
                </label>
                <input
                  id="input-DEROG"
                  type="number"
                  min="0"
                  max="25"
                  value={applicant.DEROG ?? ''}
                  onChange={(e) => handleNumericChange('DEROG', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label htmlFor="input-CLAGE" className="block text-xs font-medium text-slate-700 mb-1">
                  CLAGE — Credit Age (mos)
                </label>
                <input
                  id="input-CLAGE"
                  type="number"
                  step="1"
                  value={applicant.CLAGE ?? ''}
                  onChange={(e) => handleNumericChange('CLAGE', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
            </div>
          </div>

          {/* Group 3: Credit Activity & Applicant Profile */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-500 mb-3">
              03. Credit Activity &amp; Applicant Demographics (NINQ · CLNO · YOJ · REASON · JOB)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div>
                <label htmlFor="input-NINQ" className="block text-xs font-medium text-slate-700 mb-1">
                  NINQ — Inquiries
                </label>
                <input
                  id="input-NINQ"
                  type="number"
                  min="0"
                  max="30"
                  value={applicant.NINQ ?? ''}
                  onChange={(e) => handleNumericChange('NINQ', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label htmlFor="input-CLNO" className="block text-xs font-medium text-slate-700 mb-1">
                  CLNO — Credit Lines
                </label>
                <input
                  id="input-CLNO"
                  type="number"
                  min="0"
                  max="120"
                  value={applicant.CLNO ?? ''}
                  onChange={(e) => handleNumericChange('CLNO', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label htmlFor="input-YOJ" className="block text-xs font-medium text-slate-700 mb-1">
                  YOJ — Years in Job
                </label>
                <input
                  id="input-YOJ"
                  type="number"
                  min="0"
                  max="60"
                  step="0.5"
                  value={applicant.YOJ ?? ''}
                  onChange={(e) => handleNumericChange('YOJ', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label htmlFor="input-REASON" className="block text-xs font-medium text-slate-700 mb-1">
                  REASON — Purpose
                </label>
                <select
                  id="input-REASON"
                  value={applicant.REASON ?? 'DebtCon'}
                  onChange={(e) =>
                    onChangeApplicant({ ...applicant, REASON: e.target.value as LoanReason })
                  }
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                >
                  <option value="DebtCon">DebtCon</option>
                  <option value="HomeImp">HomeImp</option>
                </select>
              </div>
              <div>
                <label htmlFor="input-JOB" className="block text-xs font-medium text-slate-700 mb-1">
                  JOB — Occupation
                </label>
                <select
                  id="input-JOB"
                  value={applicant.JOB ?? 'Other'}
                  onChange={(e) =>
                    onChangeApplicant({ ...applicant, JOB: e.target.value as JobCategory })
                  }
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                >
                  <option value="Other">Other</option>
                  <option value="ProfExe">ProfExe</option>
                  <option value="Mgr">Mgr</option>
                  <option value="Office">Office</option>
                  <option value="Sales">Sales</option>
                  <option value="Self">Self</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              <span>Pipeline: Median/Mode Imputer</span>
              <span className="mx-1.5">·</span>
              <span>OneHotEncoder</span>
              <span className="mx-1.5">·</span>
              <span>StandardScaler</span>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Run Screening Prediction
            </button>
          </div>
        </form>

        {/* Right Column: Live Inference Result & Deep Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Primary Decision Result Surface */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  POST /predict · {prediction.model_version} · {prediction.latency_ms} ms p95
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span
                    data-testid="predicted-probability"
                    className="text-4xl font-bold font-mono tabular-nums text-[#0F1E36]"
                  >
                    {prediction.default_probability.toFixed(2)}
                  </span>
                  <span className="text-sm text-slate-500 font-mono tabular-nums">
                    ({(prediction.default_probability * 100).toFixed(0)}% default probability)
                  </span>
                </div>
              </div>

              <div
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border ${riskColorClasses.bg} ${riskColorClasses.border}`}
              >
                {riskColorClasses.icon}
                <div>
                  <div className="text-[10px] font-medium text-slate-500 leading-none">
                    Risk Band
                  </div>
                  <div
                    data-testid="predicted-risk-label"
                    className={`text-sm font-bold leading-tight mt-0.5 ${riskColorClasses.text}`}
                  >
                    {prediction.risk_label} Risk
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Risk Band Meter (Low < 0.30, Medium 0.30-0.60, High > 0.60) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-500">
                <span>0.00 (Low &lt; 0.30)</span>
                <span>0.30–0.60 (Medium)</span>
                <span>1.00 (High &gt; 0.60)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                <div
                  className={`h-full transition-transform duration-150 origin-left ${riskColorClasses.bar}`}
                  style={{ width: `${Math.min(100, Math.max(4, prediction.default_probability * 100))}%` }}
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700 leading-relaxed">
              <span className="font-semibold text-[#0F1E36]">Underwriting Action: </span>
              {prediction.recommendation}
            </div>

            {/* Segmented Inspector Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setInspectorTab('contributions')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  inspectorTab === 'contributions'
                    ? 'bg-white text-[#0F1E36] shadow-xs'
                    : 'text-slate-600 hover:text-[#0F1E36]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Risk Drivers
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('fastapi')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  inspectorTab === 'fastapi'
                    ? 'bg-white text-[#0F1E36] shadow-xs'
                    : 'text-slate-600 hover:text-[#0F1E36]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                FastAPI JSON
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('preprocessing')}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  inspectorTab === 'preprocessing'
                    ? 'bg-white text-[#0F1E36] shadow-xs'
                    : 'text-slate-600 hover:text-[#0F1E36]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                sklearn Trace
              </button>
            </div>

            {/* Tab 1: Risk Factor Contributions */}
            {inspectorTab === 'contributions' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Top Risk Factors (Slide 12 Global Weight vs Applicant Impact)</span>
                  <span className="font-mono">RF Importance</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {prediction.feature_contributions.map((item) => (
                    <div key={item.feature} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-[#0F1E36]">
                            {item.feature}
                          </span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-700 font-mono tabular-nums">
                            {item.rawDisplay}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono tabular-nums">
                          <span
                            className={
                              item.signedImpact > 0
                                ? 'text-[#B91C1C] font-semibold'
                                : item.signedImpact < 0
                                ? 'text-[#15803D] font-semibold'
                                : 'text-slate-500'
                            }
                          >
                            {item.signedImpact > 0 ? `+${item.signedImpact.toFixed(2)}` : item.signedImpact.toFixed(2)}
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-500 w-10 text-right">
                            w={item.importanceWeight.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: FastAPI Payload & Docker Specs (Slide 10) */}
            {inspectorTab === 'fastapi' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">
                    FastAPI Endpoint Contract (AWS EC2 t3.medium · 410 MB Docker)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPayload}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedJson ? 'Copied' : 'Copy JSON'}
                  </button>
                </div>
                <div className="bg-[#0F1E36] text-slate-100 rounded-lg p-3.5 font-mono text-xs overflow-x-auto space-y-2">
                  <div className="text-[#5EEAD4] text-[11px]">POST /predict</div>
                  <pre className="text-[11px] leading-relaxed text-slate-200">{fastApiRequestJson}</pre>
                  <div className="text-[#5EEAD4] text-[11px] pt-2 border-t border-slate-700/80">
                    RESPONSE (200 OK · {prediction.latency_ms} ms)
                  </div>
                  <pre className="text-[11px] leading-relaxed text-emerald-300">{fastApiResponseJson}</pre>
                </div>
              </div>
            )}

            {/* Tab 3: sklearn Preprocessing Trace (Slide 4) */}
            {inspectorTab === 'preprocessing' && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                  <div className="font-semibold text-[#0F1E36]">
                    1. SimpleImputer (Median / Mode)
                  </div>
                  <div className="text-slate-600">
                    {prediction.preprocessed.imputedFields.length === 0 ? (
                      'All 12 input features present — 0 columns required imputation.'
                    ) : (
                      <span>
                        Imputed columns:{' '}
                        <span className="font-mono font-semibold text-amber-800">
                          {prediction.preprocessed.imputedFields.join(', ')}
                        </span>{' '}
                        (DEBTINC median = 34.8%, Missingness Signal ={' '}
                        {prediction.preprocessed.debtIncMissingSignal ? 'ACTIVE 3×' : 'Inactive'}).
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                  <div className="font-semibold text-[#0F1E36]">
                    2. OneHotEncoder (REASON &amp; JOB → 1/0 Format)
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-slate-700">
                    {Object.entries(prediction.preprocessed.oneHotEncoded).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span>{k}:</span>
                        <span className={v === 1 ? 'font-bold text-[#0F766E]' : 'text-slate-400'}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                  <div className="font-semibold text-[#0F1E36]">
                    3. StandardScaler Numeric Z-Scores
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono tabular-nums text-[11px] text-slate-700">
                    {Object.entries(prediction.preprocessed.scaledNumeric).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span>{k}:</span>
                        <span>{v >= 0 ? `+${v.toFixed(2)}σ` : `${v.toFixed(2)}σ`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screening Session Audit Log */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F1E36]">
              Screening Audit Log (Live FastAPI /predict Ledger)
            </h3>
            <p className="text-xs text-slate-500">
              Every screening evaluation is logged with its input DTI, delinquency count, model version, and risk classification.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {auditLog.length} evaluations logged
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Applicant Profile</th>
                <th className="py-2.5 px-4 text-right">Loan ($)</th>
                <th className="py-2.5 px-4 text-right">DEBTINC</th>
                <th className="py-2.5 px-4 text-right">DELINQ</th>
                <th className="py-2.5 px-4">Model Version</th>
                <th className="py-2.5 px-4 text-right">Default Prob</th>
                <th className="py-2.5 px-4">Risk Label</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {auditLog.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-4 font-mono tabular-nums text-slate-500">
                    {entry.timestamp}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-[#0F1E36]">{entry.applicantLabel}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    ${entry.loanAmount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                    {entry.debtIncDisplay}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums">{entry.delinq}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">{entry.modelVersion}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-[#0F1E36]">
                    {entry.probability.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 font-semibold">
                    <span
                      className={
                        entry.riskLabel === 'High'
                          ? 'text-[#B91C1C]'
                          : entry.riskLabel === 'Medium'
                          ? 'text-[#B45309]'
                          : 'text-[#15803D]'
                      }
                    >
                      {entry.riskLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
