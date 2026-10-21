/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  calculateDriftSimulation,
  HmeqApplicantInput,
  ModelId,
  predictLoanDefault,
  SLIDE_10_EXAMPLE_INPUT,
} from './utils/mlopsEngine';
import { ScreeningLogEntry, ScreeningView } from './components/ScreeningView';
import { DatasetEdaView } from './components/DatasetEdaView';
import { ModelsMlflowView } from './components/ModelsMlflowView';
import { DriftPipelineView } from './components/DriftPipelineView';
import { PresentationDeckModal } from './components/PresentationDeckModal';

type ActiveTab = 'screening' | 'dataset' | 'models' | 'drift';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('screening');
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);

  // Screener & Model State
  const [applicant, setApplicant] = useState<HmeqApplicantInput>({
    ...SLIDE_10_EXAMPLE_INPUT,
  });
  const [selectedModel, setSelectedModel] = useState<ModelId>('rf-v3');
  const [prediction, setPrediction] = useState(() =>
    predictLoanDefault(SLIDE_10_EXAMPLE_INPUT, 'rf-v3')
  );

  // Audit Log State (seeded with Slide 10 canonical evaluation & low-risk comparison)
  const [auditLog, setAuditLog] = useState<ScreeningLogEntry[]>([
    {
      id: 'log-1',
      timestamp: '10:14:22',
      applicantLabel: 'Slide 10 FastAPI Payload (#4092)',
      loanAmount: 18000,
      debtIncDisplay: '44.5%',
      delinq: 3,
      modelVersion: 'loan-default-rf v3',
      probability: 0.72,
      riskLabel: 'High',
    },
    {
      id: 'log-2',
      timestamp: '10:12:05',
      applicantLabel: 'Prime Home Improvement (#1048)',
      loanAmount: 24500,
      debtIncDisplay: '24.2%',
      delinq: 0,
      modelVersion: 'loan-default-rf v3',
      probability: 0.08,
      riskLabel: 'Low',
    },
  ]);

  // Drift & Auto-Retrain State (Slide 11)
  const [driftLevel, setDriftLevel] = useState<'nominal' | 'moderate' | 'severe'>('severe');
  const [retrained, setRetrained] = useState<boolean>(false);

  const driftState = calculateDriftSimulation(driftLevel, retrained);

  const handleRunPrediction = (
    customInput?: HmeqApplicantInput,
    applicantLabel = 'Custom Screened Applicant',
    overrideModel?: ModelId
  ) => {
    const targetInput = customInput ?? applicant;
    const targetModel = overrideModel ?? selectedModel;
    const res = predictLoanDefault(targetInput, targetModel);
    setPrediction(res);

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    const newEntry: ScreeningLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: timeStr,
      applicantLabel,
      loanAmount: res.preprocessed.imputed.LOAN,
      debtIncDisplay: res.preprocessed.debtIncMissingSignal
        ? 'Missing (34.8%)'
        : `${res.preprocessed.imputed.DEBTINC.toFixed(1)}%`,
      delinq: res.preprocessed.imputed.DELINQ,
      modelVersion: res.model_version,
      probability: res.default_probability,
      riskLabel: res.risk_label,
    };
    setAuditLog((prev) => [newEntry, ...prev.slice(0, 14)]);
  };

  const handleSelectModel = (modelId: ModelId) => {
    setSelectedModel(modelId);
    const res = predictLoanDefault(applicant, modelId);
    setPrediction(res);
  };

  const handleLoadRecordIntoScreener = (input: HmeqApplicantInput, label: string) => {
    setApplicant(input);
    handleRunPrediction(input, label);
    setActiveTab('screening');
  };

  const handleSetDriftLevel = (level: 'nominal' | 'moderate' | 'severe') => {
    setDriftLevel(level);
    setRetrained(false);
  };

  const handleTriggerAutoRetrain = () => {
    setRetrained(true);
    setSelectedModel('rf-v4');
    setPrediction(predictLoanDefault(applicant, 'rf-v4'));
  };

  const handleResetDrift = () => {
    setDriftLevel('severe');
    setRetrained(false);
    setSelectedModel('rf-v3');
    setPrediction(predictLoanDefault(applicant, 'rf-v3'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F1E36]">
      {/* Strict 3-Zone Top Navigation Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 py-3.5">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('screening');
            }}
            className="text-base font-bold tracking-tight text-[#0F1E36] whitespace-nowrap shrink-0"
          >
            HMEQ CreditRisk MLOps
          </a>

          {/* Zone 2: 4 clean single-line navigation links */}
          <nav aria-label="Primary Workspace Views" className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('screening')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'screening'
                  ? 'text-[#0F1E36] font-semibold underline decoration-[#0D9488] decoration-2 underline-offset-8'
                  : 'hover:text-[#0F1E36]'
              }`}
            >
              Screening &amp; API
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dataset')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'dataset'
                  ? 'text-[#0F1E36] font-semibold underline decoration-[#0D9488] decoration-2 underline-offset-8'
                  : 'hover:text-[#0F1E36]'
              }`}
            >
              Dataset &amp; EDA
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('models')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'models'
                  ? 'text-[#0F1E36] font-semibold underline decoration-[#0D9488] decoration-2 underline-offset-8'
                  : 'hover:text-[#0F1E36]'
              }`}
            >
              Models &amp; MLflow
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('drift')}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'drift'
                  ? 'text-[#0F1E36] font-semibold underline decoration-[#0D9488] decoration-2 underline-offset-8'
                  : 'hover:text-[#0F1E36]'
              }`}
            >
              Drift &amp; Pipeline
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsDeckModalOpen(true)}
              className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-[#0F1E36] hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Slide Deck (PDF)
            </button>
          </div>
        </div>
      </header>

      {/* Slide 1 Hero Banner & 4 Core Project Metrics */}
      <section className="bg-[#0F1E36] text-white border-b border-slate-800">
        <div className="max-w-[1360px] mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <div className="text-xs font-semibold tracking-wider text-[#5EEAD4]">
                MLOPS COURSE PROJECT · 2026
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                Loan Default Prediction Using Machine Learning
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                An end-to-end MLOps pipeline: from raw HMEQ loan data to a monitored, self-retraining prediction service.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>Presented by Aditya B Kale</span>
                <span aria-hidden="true">·</span>
                <span>Lavesh V Hasani</span>
                <span aria-hidden="true">·</span>
                <span>Yash S Khobragade</span>
              </div>
            </div>

            {/* 4 Key Metrics from Slide 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800 shrink-0">
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
                  5,960
                </div>
                <div className="text-xs text-slate-400 mt-0.5">loan records</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
                  4
                </div>
                <div className="text-xs text-slate-400 mt-0.5">models compared</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
                  10
                </div>
                <div className="text-xs text-slate-400 mt-0.5">MLOps tools integrated</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#5EEAD4]">
                  0.95
                </div>
                <div className="text-xs text-slate-400 mt-0.5">final ROC-AUC</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Mobile Workspace View Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 mb-6 bg-slate-200/70 rounded-xl md:hidden" role="navigation" aria-label="Mobile Workspace Views">
          <button
            type="button"
            onClick={() => setActiveTab('screening')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'screening' ? 'bg-white text-[#0F1E36] shadow-xs' : 'text-slate-600'
            }`}
          >
            Screening &amp; API
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dataset')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'dataset' ? 'bg-white text-[#0F1E36] shadow-xs' : 'text-slate-600'
            }`}
          >
            Dataset &amp; EDA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('models')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'models' ? 'bg-white text-[#0F1E36] shadow-xs' : 'text-slate-600'
            }`}
          >
            Models &amp; MLflow
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('drift')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'drift' ? 'bg-white text-[#0F1E36] shadow-xs' : 'text-slate-600'
            }`}
          >
            Drift &amp; Pipeline
          </button>
        </div>

        {activeTab === 'screening' && (
          <ScreeningView
            applicant={applicant}
            onChangeApplicant={setApplicant}
            selectedModel={selectedModel}
            onSelectModel={handleSelectModel}
            prediction={prediction}
            onRunPrediction={handleRunPrediction}
            auditLog={auditLog}
          />
        )}

        {activeTab === 'dataset' && (
          <DatasetEdaView onLoadRecordIntoScreener={handleLoadRecordIntoScreener} />
        )}

        {activeTab === 'models' && (
          <ModelsMlflowView
            activeModelId={selectedModel}
            onSelectServingModel={(modelId) => {
              handleSelectModel(modelId);
              setActiveTab('screening');
            }}
          />
        )}

        {activeTab === 'drift' && (
          <DriftPipelineView
            driftState={driftState}
            onSetDriftLevel={handleSetDriftLevel}
            onTriggerAutoRetrain={handleTriggerAutoRetrain}
            onResetDrift={handleResetDrift}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-[1360px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#0F1E36]">Loan Default Prediction · MLOps Project</span>
            <span aria-hidden="true">·</span>
            <span>Aditya B Kale · Lavesh V Hasani · Yash S Khobragade</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsDeckModalOpen(true)}
              className="hover:text-[#0F1E36] underline underline-offset-4 cursor-pointer"
            >
              View 13-Slide Presentation PDF
            </button>
          </div>
        </div>
      </footer>

      {/* 13-Slide Presentation Deck Modal */}
      <PresentationDeckModal
        isOpen={isDeckModalOpen}
        onClose={() => setIsDeckModalOpen(false)}
      />
    </div>
  );
}
