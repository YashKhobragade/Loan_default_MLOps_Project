import React, { useState } from 'react';
import {
  DriftSimulationResult,
} from '../utils/mlopsEngine';
import { MLOPS_PIPELINE_STAGES, PipelineStageSpec } from '../data/hmeqData';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

interface DriftPipelineViewProps {
  driftState: DriftSimulationResult;
  onSetDriftLevel: (level: 'nominal' | 'moderate' | 'severe') => void;
  onTriggerAutoRetrain: () => void;
  onResetDrift: () => void;
}

export const DriftPipelineView: React.FC<DriftPipelineViewProps> = ({
  driftState,
  onSetDriftLevel,
  onTriggerAutoRetrain,
  onResetDrift,
}) => {
  const [selectedStage, setSelectedStage] = useState<PipelineStageSpec>(MLOPS_PIPELINE_STAGES[0]);

  const ciCdSteps = [
    {
      num: '1',
      phase: 'CI · Push / PR',
      title: 'Lint & format',
      detail: 'flake8 and black on every file',
      status: 'Passed (14s)',
    },
    {
      num: '2',
      phase: 'CI · Push / PR',
      title: 'Unit tests',
      detail: '34 pytest tests for preprocessing and the API',
      status: '34/34 Passed (28s)',
    },
    {
      num: '3',
      phase: 'CI · Push / PR',
      title: 'Data validation',
      detail: 'Schema, type and value-range checks',
      status: 'Validated (19s)',
    },
    {
      num: '4',
      phase: 'CD · Merge / Drift',
      title: 'Retrain (dvc repro)',
      detail: 'dvc repro reruns only changed stages',
      status: driftState.retrained ? 'Retrained v4 (4m 12s)' : 'Ready',
    },
    {
      num: '5',
      phase: 'CD · Merge / Drift',
      title: 'Promotion gate',
      detail: 'New model must match or beat production recall & ROC-AUC drop ≤ 0.01',
      status: driftState.retrained ? 'Gate Passed (Recall 0.78)' : 'Enforced',
    },
    {
      num: '6',
      phase: 'CD · Merge / Drift',
      title: 'Build & push',
      detail: '410 MB Docker image (python:3.11-slim) to registry',
      status: driftState.retrained ? 'Pushed :v4 (2m 05s)' : 'v3 Active',
    },
    {
      num: '7',
      phase: 'CD · Merge / Drift',
      title: 'Deploy',
      detail: 'Rolling update on AWS EC2 t3.medium server',
      status: driftState.retrained ? 'Live on EC2 (42ms p95)' : 'Live on EC2',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Slide 11: Interactive Drift Simulation & Self-Retraining Controls */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl font-bold text-[#0F1E36]">
              Monitoring, Drift Detection &amp; Self-Retraining Simulation
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Evidently calculates weekly Population Stability Index (PSI) across all 12 features. PSI &gt; 0.20 on a top-5 feature or Recall &lt; 0.72 triggers automated CI/CD retraining.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSetDriftLevel('nominal')}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                driftState.driftLevel === 'nominal' && !driftState.retrained
                  ? 'bg-[#0F1E36] text-white border-[#0F1E36]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              1. Nominal Baseline
            </button>
            <button
              type="button"
              onClick={() => onSetDriftLevel('moderate')}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                driftState.driftLevel === 'moderate' && !driftState.retrained
                  ? 'bg-[#0F1E36] text-white border-[#0F1E36]'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              2. Moderate Shift
            </button>
            <button
              type="button"
              onClick={() => onSetDriftLevel('severe')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                driftState.driftLevel === 'severe' && !driftState.retrained
                  ? 'bg-[#B91C1C] text-white border-[#B91C1C]'
                  : 'bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
              }`}
            >
              3. Simulate High-DEBTINC Drift (Slide 11)
            </button>
          </div>
        </div>

        {/* Slide 11 Dark Navy Drift Simulation Banner */}
        <div className="bg-[#0F1E36] text-white rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-3 space-y-1">
              <div className="text-xs font-semibold text-[#5EEAD4]">
                DRIFT SIMULATION (SLIDE 11)
              </div>
              <div className="text-sm font-medium text-slate-200">
                {driftState.driftLevel === 'severe'
                  ? 'Synthetic applicants with higher DEBTINC'
                  : driftState.driftLevel === 'moderate'
                  ? 'Gradual upward shift in applicant DTI'
                  : 'Baseline HMEQ validation distribution'}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Active: {driftState.activeModelVersion}
              </div>
            </div>

            <div className="md:col-span-2">
              <div
                data-testid="drifted-features-count"
                className="text-3xl font-bold font-mono tabular-nums text-white"
              >
                {driftState.driftedFeaturesCount} of {driftState.totalFeatures}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                features flagged as drifted
              </div>
            </div>

            <div className="md:col-span-2">
              <div
                data-testid="drift-current-recall"
                className={`text-3xl font-bold font-mono tabular-nums ${
                  driftState.currentRecall < 0.72 ? 'text-amber-400' : 'text-[#5EEAD4]'
                }`}
              >
                {driftState.currentRecall.toFixed(2)}
              </div>
              <div className="text-xs text-slate-300 mt-1">
                {driftState.retrained
                  ? 'recall after auto-retrain'
                  : driftState.currentRecall < 0.72
                  ? 'recall after drift (below 0.72)'
                  : 'active model recall (≥ 0.72)'}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="text-3xl font-bold font-mono tabular-nums text-[#5EEAD4]">
                0.78
              </div>
              <div className="text-xs text-slate-300 mt-1">
                target recall after auto-retrain
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col sm:flex-row md:flex-col gap-2 justify-end">
              <button
                type="button"
                onClick={onTriggerAutoRetrain}
                disabled={driftState.retrained}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#0F1E36] bg-[#5EEAD4] hover:bg-[#2DD4BF] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {driftState.retrained ? 'Auto-Retrain Complete (v4)' : 'Trigger Auto-Retrain Loop'}
              </button>
              {driftState.retrained && (
                <button
                  type="button"
                  onClick={onResetDrift}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Simulation
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2.5 text-xs text-slate-200">
            {driftState.alertTriggered ? (
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#5EEAD4] shrink-0" />
            )}
            <span data-testid="drift-status-banner">{driftState.recommendedAction}</span>
          </div>
        </div>

        {/* Slide 11 Monitoring Signals & Thresholds Table + Evidently PSI Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 4 Monitoring Signals Table (5 cols) */}
          <div className="lg:col-span-5 border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-bold text-[#0F1E36]">
                Production Monitoring Signals &amp; Alert Thresholds (Slide 11)
              </h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0F1E36] text-white text-[11px] font-semibold">
                  <th className="py-2.5 px-3">Signal</th>
                  <th className="py-2.5 px-3">Tool &amp; Freq</th>
                  <th className="py-2.5 px-3">Alert Threshold</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                <tr>
                  <td className="py-3 px-3 font-semibold text-[#0F1E36]">Data drift</td>
                  <td className="py-3 px-3 text-slate-600">Evidently, weekly</td>
                  <td className="py-3 px-3 font-mono text-[11px]">PSI &gt; 0.2 on top-5 feature</td>
                  <td className="py-3 px-3 font-medium text-[#0F766E]">Alert + auto-retrain</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-[#0F1E36]">Prediction drift</td>
                  <td className="py-3 px-3 text-slate-600">Evidently, weekly</td>
                  <td className="py-3 px-3 font-mono text-[11px]">High-risk shifts &gt; 10 pts</td>
                  <td className="py-3 px-3 text-slate-700">Investigate pipeline</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-[#0F1E36]">Model quality</td>
                  <td className="py-3 px-3 text-slate-600">Labels, monthly</td>
                  <td className="py-3 px-3 font-mono text-[11px]">Recall below 0.72</td>
                  <td className="py-3 px-3 font-medium text-[#0F766E]">Auto-retrain via CI/CD</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-[#0F1E36]">Service health</td>
                  <td className="py-3 px-3 text-slate-600">Prometheus + Grafana</td>
                  <td className="py-3 px-3 font-mono text-[11px]">p95 &gt; 200ms or err &gt; 1%</td>
                  <td className="py-3 px-3 text-slate-700">Alert on-call member</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 12-Feature Evidently PSI Table (7 cols) */}
          <div className="lg:col-span-7 border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#0F1E36]">
                Evidently Feature Drift Report — Population Stability Index (PSI)
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                Threshold: PSI &gt; 0.20 = Drifted
              </span>
            </div>
            <div className="overflow-x-auto max-h-[340px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 sticky top-0">
                    <th className="py-2 px-3">Feature</th>
                    <th className="py-2 px-3">Rank</th>
                    <th className="py-2 px-3 text-right">Baseline Mean</th>
                    <th className="py-2 px-3 text-right">Current Mean</th>
                    <th className="py-2 px-3 text-right">PSI Score</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {driftState.features.map((f) => (
                    <tr key={f.feature} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 font-mono font-bold text-[#0F1E36]">
                        {f.feature}
                        {f.isTop5 && (
                          <span className="ml-1.5 text-[10px] font-sans font-normal text-slate-500">
                            · Top-5
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono tabular-nums text-slate-500">
                        #{f.importanceRank}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-600">
                        {f.baselineMean}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-medium text-[#0F1E36]">
                        {f.currentMean}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-bold">
                        <span
                          className={
                            f.status === 'drifted'
                              ? 'text-[#B91C1C]'
                              : f.status === 'warning'
                              ? 'text-[#B45309]'
                              : 'text-[#15803D]'
                          }
                        >
                          {f.psi.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold">
                        <span
                          className={
                            f.status === 'drifted'
                              ? 'text-[#B91C1C]'
                              : f.status === 'warning'
                              ? 'text-[#B45309]'
                              : 'text-[#15803D]'
                          }
                        >
                          {f.status === 'drifted'
                            ? 'Drifted (>0.20)'
                            : f.status === 'warning'
                            ? 'Shift (0.10–0.20)'
                            : 'Nominal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 8: End-to-End 10-Stage MLOps Pipeline Loop */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-[#0F1E36]">
              End-to-End 10-Stage MLOps Pipeline Architecture (Slide 8)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              GitHub Actions automates every arrow: each push re-tests, retrains and redeploys the pipeline. Click any stage to inspect its specification.
            </p>
          </div>
          <span className="text-xs font-mono text-[#0F766E]">
            Build (01–05) → Serve (06–08) → Retrain Loop (09–10)
          </span>
        </div>

        {/* 10 Stage Interactive Grid (5 top row, 5 bottom row matching Slide 8) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {MLOPS_PIPELINE_STAGES.map((stage) => {
            const isSelected = selectedStage.step === stage.step;
            const phaseColor =
              stage.phase === 'Retrain Loop'
                ? 'border-amber-300 bg-amber-50/50'
                : stage.phase === 'Serve'
                ? 'border-[#99F6E4] bg-[#F0FDFA]/60'
                : 'border-slate-200 bg-slate-50/60';

            return (
              <button
                key={stage.step}
                type="button"
                onClick={() => setSelectedStage(stage)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F1E36] text-white border-[#0F1E36] shadow-sm'
                    : `${phaseColor} hover:border-slate-400 text-[#0F1E36]`
                }`}
              >
                <div
                  className={`text-[11px] font-mono font-bold ${
                    isSelected
                      ? 'text-[#5EEAD4]'
                      : stage.phase === 'Retrain Loop'
                      ? 'text-[#B45309]'
                      : 'text-[#0F766E]'
                  }`}
                >
                  {stage.step}
                </div>
                <div className="text-sm font-bold mt-1">{stage.title}</div>
                <p
                  className={`text-xs mt-1 line-clamp-2 ${
                    isSelected ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {stage.detail}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Inspector Bar */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="font-bold text-[#0F1E36]">
              {selectedStage.step} · {selectedStage.title} ({selectedStage.tool})
            </div>
            <p className="text-slate-600">{selectedStage.detail}</p>
          </div>
          <div className="font-mono text-slate-700 bg-white px-3 py-1.5 rounded border border-slate-200 shrink-0">
            Artifact / Hook: {selectedStage.artifactOrEndpoint}
          </div>
        </div>
      </section>

      {/* Slide 9: CI/CD with GitHub Actions (7 Steps) */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#0D9488]" />
            <h3 className="text-base font-bold text-[#0F1E36]">
              CI/CD Automation with GitHub Actions (Slide 9)
            </h3>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            Full CI + CD pipeline execution time: ~9 minutes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {ciCdSteps.map((step) => (
            <div
              key={step.num}
              className={`p-3.5 rounded-lg border ${
                step.num === '5'
                  ? 'bg-amber-50/60 border-amber-200'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="font-bold text-[#0F766E]">Step {step.num}</span>
                <span>{step.phase}</span>
              </div>
              <div className="text-xs font-bold text-[#0F1E36] mt-1.5">{step.title}</div>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">{step.detail}</p>
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] font-mono text-[#0F766E] font-medium">
                {step.status}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
