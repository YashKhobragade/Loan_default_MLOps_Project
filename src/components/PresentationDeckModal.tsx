import React from 'react';
import { PRESENTATION_SLIDES } from '../data/hmeqData';
import { Download, ExternalLink, FileText, X } from 'lucide-react';

interface PresentationDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PDF_ASSET_PATH = '/assets/aistudio/34_57_91_Loan_Default_Prediction_-_MLOps.pptx_1a4ab723.pdf';

export const PresentationDeckModal: React.FC<PresentationDeckModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-modal-title"
      className="fixed inset-0 z-50 bg-[#0F1E36]/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#0D9488] shrink-0" />
            <div>
              <h2 id="deck-modal-title" className="text-base font-bold text-[#0F1E36]">
                MLOps Course Project Deck (13 Slides) — Loan Default Prediction
              </h2>
              <p className="text-xs text-slate-500">
                Presented by Aditya B Kale · Lavesh V Hasani · Yash S Khobragade
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={PDF_ASSET_PATH}
              download="Loan_Default_Prediction_MLOps.pdf"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Presentation Deck Modal"
              className="p-1.5 text-slate-500 hover:text-[#0F1E36] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Embedded PDF Viewer */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 h-[360px]">
            <iframe
              src={PDF_ASSET_PATH}
              title="Loan Default Prediction MLOps Presentation PDF"
              className="w-full h-full border-0"
            />
          </div>

          {/* Slide 13 Takeaways, Limitations & Future Scope */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h3 className="text-sm font-bold text-[#0F1E36]">Key Takeaways (Slide 13)</h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Random Forest reached 0.79 recall and 0.95 ROC-AUC on 1,192 unseen test loans.</li>
                <li>DVC, MLflow, Docker and Evidently monitoring make results reproducible and reliable.</li>
                <li>CI/CD automation turns a notebook into a self-maintaining prediction service.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h3 className="text-sm font-bold text-[#0F1E36]">Limitations (Slide 13)</h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>HMEQ dataset is relatively small (5,960 loans) from a single period and region.</li>
                <li>Heavy missing data (11 of 12 columns; DEBTINC 21.3%) means imputation can mask patterns.</li>
                <li>No formal demographic fairness audit conducted yet across applicant groups.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h3 className="text-sm font-bold text-[#0F1E36]">Future Scope (Slide 13)</h3>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Evaluate XGBoost and LightGBM with isotonic probability calibration.</li>
                <li>Add per-applicant SHAP explanations for every underwriting decision.</li>
                <li>Integrate fairness checks, shadow A/B testing, and AWS SageMaker endpoints.</li>
              </ul>
            </div>
          </div>

          {/* 13-Slide Index */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-3">
              Complete 13-Slide Presentation Index
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESENTATION_SLIDES.map((s) => (
                <div
                  key={s.slide}
                  className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#0F766E] font-bold">
                    <span>Slide {String(s.slide).padStart(2, '0')} / 13</span>
                  </div>
                  <div className="font-bold text-[#0F1E36]">{s.title}</div>
                  <p className="text-slate-600 leading-relaxed">{s.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
