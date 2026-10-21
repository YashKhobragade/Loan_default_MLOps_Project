import React, { useState } from 'react';
import {
  CANDIDATE_MODELS,
  CandidateModelComparison,
  MLFLOW_EXPERIMENT_RUNS,
  MlflowRunRecord,
} from '../data/hmeqData';
import { evaluatePromotionGate, ModelId } from '../utils/mlopsEngine';
import { CheckCircle2, GitCommit, Lock, Play, ShieldCheck, XCircle } from 'lucide-react';

interface ModelsMlflowViewProps {
  activeModelId: ModelId;
  onSelectServingModel: (modelId: ModelId) => void;
}

export const ModelsMlflowView: React.FC<ModelsMlflowViewProps> = ({
  activeModelId,
  onSelectServingModel,
}) => {
  const [focusedModel, setFocusedModel] = useState<CandidateModelComparison>(CANDIDATE_MODELS[3]); // Random Forest selected by default
  const [mlflowFilter, setMlflowFilter] = useState<'top5' | 'all' | 'Random Forest' | 'Bagging' | 'Decision Tree' | 'Logistic Reg.'>('top5');

  // Interactive CI/CD Promotion Gate simulator state (Slide 9)
  const [gateCandidateName, setGateCandidateName] = useState('rf-tuned-07 (v3 Candidate)');
  const [gateCandidateRecall, setGateCandidateRecall] = useState(0.79);
  const [gateCandidateRocAuc, setGateCandidateRocAuc] = useState(0.95);

  const productionBaseline = {
    recall: 0.79,
    rocAuc: 0.95,
  };

  const gateResult = evaluatePromotionGate({
    candidateRecall: gateCandidateRecall,
    candidateRocAuc: gateCandidateRocAuc,
    productionRecall: productionBaseline.recall,
    productionRocAuc: productionBaseline.rocAuc,
  });

  const filteredRuns = MLFLOW_EXPERIMENT_RUNS.filter((r) => {
    if (mlflowFilter === 'top5') return r.top5Slide6;
    if (mlflowFilter === 'all') return true;
    return r.modelFamily === mlflowFilter;
  });

  const handleTestRunInGate = (run: MlflowRunRecord) => {
    setGateCandidateName(`${run.runName} (${run.modelFamily})`);
    setGateCandidateRecall(run.recall);
    setGateCandidateRocAuc(run.rocAuc);
  };

  return (
    <div className="space-y-8">
      {/* Slide 5 & Slide 7: Comparing 4 Candidate Models on 1,192 Unseen Test Loans */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl font-bold text-[#0F1E36]">
              Comparing Four Candidate Models on the Test Set
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Evaluated on 1,192 unseen test loans (238 real defaulters, 954 repaid) with 5-fold stratified cross-validation across 48 grid-search runs.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            <span>5-Fold Stratified CV</span>
            <span className="mx-1.5">·</span>
            <span>48 Grid-Search Runs</span>
            <span className="mx-1.5">·</span>
            <span>Optimised for Default Recall</span>
          </div>
        </div>

        {/* 3 Key Highlights from Slide 7 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-2xl font-bold font-mono tabular-nums text-[#0F766E]">0.79</div>
            <div className="text-xs font-bold text-[#0F1E36] mt-1">Highest Recall (4 in 5 Caught)</div>
            <p className="text-xs text-slate-600 mt-1">
              Random Forest flags 188 of the 238 real defaulters in the test set, letting only 50 through (half as many bad loans as Logistic Regression&apos;s 100).
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-2xl font-bold font-mono tabular-nums text-[#0F1E36]">0.95</div>
            <div className="text-xs font-bold text-[#0F1E36] mt-1">Best ROC-AUC Discrimination</div>
            <p className="text-xs text-slate-600 mt-1">
              Ranks risky borrowers above safe ones most reliably across all operating probability thresholds.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-2xl font-bold font-mono tabular-nums text-[#0F1E36]">±0.02</div>
            <div className="text-xs font-bold text-[#0F1E36] mt-1">Most Stable Across CV Folds</div>
            <p className="text-xs text-slate-600 mt-1">
              Recall barely changes across 5 stratified folds; random feature subsets decorrelate trees and cut variance.
            </p>
          </div>
        </div>

        {/* Model Comparison Table + Confusion Matrix Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Table (7 cols) */}
          <div className="lg:col-span-7 border border-slate-200 rounded-lg overflow-hidden flex flex-col justify-between bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0F1E36] text-white text-[11px] font-semibold">
                    <th className="py-3 px-4">Model</th>
                    <th className="py-3 px-3 text-right">Accuracy</th>
                    <th className="py-3 px-3 text-right">Precision</th>
                    <th className="py-3 px-3 text-right">Recall (key)</th>
                    <th className="py-3 px-3 text-right">F1-score</th>
                    <th className="py-3 px-3 text-right">ROC-AUC</th>
                    <th className="py-3 px-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {CANDIDATE_MODELS.map((m) => {
                    const isFocused = focusedModel.id === m.id;
                    return (
                      <tr
                        key={m.id}
                        onClick={() => setFocusedModel(m)}
                        className={`cursor-pointer transition-colors ${
                          m.selected
                            ? 'bg-[#F0FDFA] hover:bg-[#CCFBF1]/60'
                            : isFocused
                            ? 'bg-slate-100'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0F1E36]">{m.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{m.code}</div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          {m.accuracy.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          {m.precision.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold text-[#0F766E]">
                          {m.recall.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          {m.f1.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums font-semibold">
                          {m.rocAuc.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFocusedModel(m);
                              onSelectServingModel(m.id);
                            }}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              activeModelId === m.id
                                ? 'bg-[#0F1E36] text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {activeModelId === m.id ? 'Active in API' : 'Use in API'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span>Click any candidate model row to inspect its test-set Confusion Matrix</span>
              <span className="font-mono text-slate-500">1,192 unseen test loans (238 BAD=1 · 954 BAD=0)</span>
            </div>
          </div>

          {/* Focused Model Confusion Matrix & Business Impact (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  Confusion Matrix · 1,192 Test Loans
                </div>
                <h3 className="text-base font-bold text-[#0F1E36] mt-0.5">
                  {focusedModel.name}
                </h3>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-600">
                CV Recall SD: {focusedModel.cvStability}
              </span>
            </div>

            <p className="text-xs text-slate-600">
              {focusedModel.description}{' '}
              <span className="font-mono text-slate-700">({focusedModel.tunedParams})</span>
            </p>

            {/* 2x2 Confusion Matrix Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-[11px] text-slate-500">True Positives (Defaulters Caught)</div>
                <div className="text-xl font-bold font-mono tabular-nums text-[#0F766E] mt-1">
                  {focusedModel.confusionMatrix.tp} / 238
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Recall = {(focusedModel.confusionMatrix.tp / 238).toFixed(2)}
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-[11px] text-slate-500">False Negatives (Bad Loans Approved)</div>
                <div className="text-xl font-bold font-mono tabular-nums text-[#B91C1C] mt-1">
                  {focusedModel.confusionMatrix.fn} / 238
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Missed defaulters ({((focusedModel.confusionMatrix.fn / 238) * 100).toFixed(0)}%)
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-[11px] text-slate-500">True Negatives (Good Loans Approved)</div>
                <div className="text-xl font-bold font-mono tabular-nums text-[#0F1E36] mt-1">
                  {focusedModel.confusionMatrix.tn} / 954
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Specificity = {(focusedModel.confusionMatrix.tn / 954).toFixed(2)}
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-[11px] text-slate-500">False Positives (Safe Flagged)</div>
                <div className="text-xl font-bold font-mono tabular-nums text-slate-700 mt-1">
                  {focusedModel.confusionMatrix.fp} / 954
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Precision = {focusedModel.precision.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#F0FDFA] border border-[#99F6E4] rounded-lg text-xs text-[#0F766E]">
              <span className="font-bold">Business Impact (Slide 12): </span>
              The Logistic Regression baseline let 100 defaulters through the test set; Random Forest lets only 50 through — cutting bad loans approved in half.
            </div>
          </div>
        </div>
      </section>

      {/* Slide 6: Experiment Tracking with MLflow & Slide 9: CI/CD Promotion Gate */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* MLflow Experiment Runs Table (8 cols) */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#0F1E36]">
                Experiment Tracking with MLflow (48 Grid-Search Runs)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every run links to its Git commit and DVC data version. Best run <span className="font-mono font-semibold">rf-tuned-07</span> registered as <span className="font-mono font-semibold">loan-default-rf v3</span> (Production).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['top5', 'all', 'Random Forest', 'Bagging', 'Decision Tree', 'Logistic Reg.'] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setMlflowFilter(tab)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      mlflowFilter === tab
                        ? 'bg-white text-[#0F1E36] shadow-xs'
                        : 'text-slate-600 hover:text-[#0F1E36]'
                    }`}
                  >
                    {tab === 'top5' ? 'Top 5 (Slide 6)' : tab === 'all' ? 'All Runs' : tab}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 px-4">Run Name</th>
                  <th className="py-3 px-3">Model</th>
                  <th className="py-3 px-3 text-right">Recall</th>
                  <th className="py-3 px-3 text-right">ROC-AUC</th>
                  <th className="py-3 px-3">Git · DVC Lineage</th>
                  <th className="py-3 px-3">Registry Stage</th>
                  <th className="py-3 px-4 text-right">CI/CD Gate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRuns.map((run) => (
                  <tr key={run.runId} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#0F1E36]">{run.runName}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                        {run.hyperparameters}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">{run.modelFamily}</td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-[#0F766E]">
                      {run.recall.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                      {run.rocAuc.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <GitCommit className="w-3 h-3" />
                        {run.gitCommit}
                      </span>
                      <span className="mx-1">·</span>
                      <span>{run.dvcVersion}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs">
                      <span
                        className={
                          run.stage === 'Production'
                            ? 'font-bold text-[#0F766E]'
                            : run.stage === 'Staging'
                            ? 'font-semibold text-[#B45309]'
                            : 'text-slate-500'
                        }
                      >
                        {run.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleTestRunInGate(run)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        Test Gate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Slide 9: Interactive CI/CD Promotion Gate Simulator (4 cols) */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E]">
                <Lock className="w-3.5 h-3.5" />
                CI/CD Step 05 · Promotion Gate
              </div>
              <h3 className="text-base font-bold text-[#0F1E36] mt-1">
                GitHub Actions Promotion Gate Evaluator
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Deploy only if candidate <span className="font-mono font-semibold">recall ≥ production recall (0.79)</span> and{' '}
            <span className="font-mono font-semibold">ROC-AUC drops by at most 0.01 (≥ 0.94)</span>.
          </p>

          <div className="space-y-3">
            <div>
              <label htmlFor="gate-candidate-name" className="block text-xs font-medium text-slate-700 mb-1">
                Candidate Run Under Evaluation
              </label>
              <input
                id="gate-candidate-name"
                type="text"
                value={gateCandidateName}
                onChange={(e) => setGateCandidateName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="gate-recall-input" className="block text-xs font-medium text-slate-700 mb-1">
                  Candidate Recall
                </label>
                <input
                  id="gate-recall-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={gateCandidateRecall}
                  onChange={(e) => setGateCandidateRecall(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="gate-rocauc-input" className="block text-xs font-medium text-slate-700 mb-1">
                  Candidate ROC-AUC
                </label>
                <input
                  id="gate-rocauc-input"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={gateCandidateRocAuc}
                  onChange={(e) => setGateCandidateRocAuc(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div
            data-testid="promotion-gate-verdict"
            className={`p-4 rounded-lg border space-y-2 ${
              gateResult.passed
                ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]'
                : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C]'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              {gateResult.passed ? (
                <ShieldCheck className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              <span>
                {gateResult.passed
                  ? 'PROMOTION GATE PASSED — Deploy Approved'
                  : 'PROMOTION GATE BLOCKED — Deploy Halted'}
              </span>
            </div>
            <p className="text-xs leading-relaxed">{gateResult.summary}</p>
            <div className="pt-2 border-t border-current/15 flex items-center justify-between text-[11px] font-mono tabular-nums">
              <span>
                Recall Check: {gateResult.recallPassed ? 'PASS' : 'FAIL'} (
                {gateResult.recallDelta >= 0 ? `+${gateResult.recallDelta.toFixed(2)}` : gateResult.recallDelta.toFixed(2)})
              </span>
              <span>
                ROC-AUC Check: {gateResult.rocAucPassed ? 'PASS' : 'FAIL'} (
                {gateResult.rocAucDelta >= 0 ? `+${gateResult.rocAucDelta.toFixed(2)}` : gateResult.rocAucDelta.toFixed(2)})
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
