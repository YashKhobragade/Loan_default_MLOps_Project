import React, { useState } from 'react';
import {
  HMEQ_FEATURE_SPECS,
  SAMPLE_HMEQ_RECORDS,
  SampleHmeqRecord,
} from '../data/hmeqData';
import { HmeqApplicantInput } from '../utils/mlopsEngine';
import { ArrowUpRight, Database, Filter, Search } from 'lucide-react';

interface DatasetEdaViewProps {
  onLoadRecordIntoScreener: (input: HmeqApplicantInput, label: string) => void;
}

export const DatasetEdaView: React.FC<DatasetEdaViewProps> = ({
  onLoadRecordIntoScreener,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [recordFilter, setRecordFilter] = useState<'all' | 'defaulted' | 'repaid' | 'missing-dti'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const featureGroups = ['All', 'Affordability', 'Credit history', 'Credit activity', 'Loan & property', 'Applicant'];

  const filteredFeatures = HMEQ_FEATURE_SPECS.filter(
    (f) => selectedGroup === 'All' || f.group === selectedGroup
  );

  const filteredRecords = SAMPLE_HMEQ_RECORDS.filter((rec) => {
    if (recordFilter === 'defaulted' && rec.BAD !== 1) return false;
    if (recordFilter === 'repaid' && rec.BAD !== 0) return false;
    if (recordFilter === 'missing-dti' && rec.DEBTINC !== null) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        rec.recordId.toLowerCase().includes(q) ||
        (rec.JOB ?? '').toLowerCase().includes(q) ||
        (rec.REASON ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleLoadRecord = (rec: SampleHmeqRecord) => {
    const input: HmeqApplicantInput = {
      LOAN: rec.LOAN,
      MORTDUE: rec.MORTDUE,
      VALUE: rec.VALUE,
      REASON: rec.REASON,
      JOB: rec.JOB,
      YOJ: rec.YOJ,
      DEROG: rec.DEROG,
      DELINQ: rec.DELINQ,
      CLAGE: rec.CLAGE,
      NINQ: rec.NINQ,
      CLNO: rec.CLNO,
      DEBTINC: rec.DEBTINC,
    };
    onLoadRecordIntoScreener(input, `${rec.recordId} (${rec.BAD === 1 ? 'Actual Default' : 'Actual Repaid'})`);
  };

  return (
    <div className="space-y-8">
      {/* HMEQ Dataset Summary Banner & Business Problem (Slides 2, 3, 4) */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl font-bold text-[#0F1E36]">
              The HMEQ Dataset &amp; Exploratory Data Analysis
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              5,960 home-equity loan applications tracked with DVC. Imbalanced target: 4,771 repaid (80.1%) vs 1,189 defaulted (19.9%).
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            <span>Stratified 80/20 Split: 4,768 Train</span>
            <span className="mx-1.5">·</span>
            <span>1,192 Test</span>
            <span className="mx-1.5">·</span>
            <span>DVC v2.4</span>
          </div>
        </div>

        {/* 4 Key Dataset & EDA Findings Grid (Slide 3 & Slide 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-xs font-medium text-slate-500">Total Applications</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#0F1E36] mt-1">
              5,960
            </div>
            <p className="text-xs text-slate-600 mt-1.5">
              12 input features across 5 credit domains plus binary target <span className="font-mono font-semibold">BAD</span>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-xs font-medium text-slate-500">Class Imbalance (BAD = 1)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#B91C1C] mt-1">
              19.9%
            </div>
            <p className="text-xs text-slate-600 mt-1.5">
              1,189 defaulted vs 4,771 repaid (80.1%) — accuracy alone is misleading; recall is key.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-xs font-medium text-slate-500">Missing Data Signal</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#B45309] mt-1">
              21.3%
            </div>
            <p className="text-xs text-slate-600 mt-1.5">
              11 of 12 features have gaps; loans missing <span className="font-mono font-semibold">DEBTINC</span> default ~3× more often.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="text-xs font-medium text-slate-500">Preprocessing Pipeline</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[#0F766E] mt-1">
              4 Stages
            </div>
            <p className="text-xs text-slate-600 mt-1.5">
              Median/mode imputation · Stratified 80/20 split · One-hot encoding · StandardScaler.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Dictionary & Missingness Analysis Table (Slides 3, 4, 12) */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#0F1E36]">
              HMEQ Feature Dictionary, Imputation Rules &amp; Predictive Importance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strongest signals: delinquencies (DELINQ), derogatory reports (DEROG), high DEBTINC, and short credit history (CLAGE).
            </p>
          </div>

          {/* Group Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {featureGroups.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setSelectedGroup(group)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  selectedGroup === group
                    ? 'bg-white text-[#0F1E36] shadow-xs'
                    : 'text-slate-600 hover:text-[#0F1E36]'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4">Group</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Missing Rate</th>
                <th className="py-3 px-4">sklearn Imputation</th>
                <th className="py-3 px-4 text-right">Train Fill Value</th>
                <th className="py-3 px-4 text-right">RF Importance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredFeatures.map((feat) => (
                <tr key={feat.feature} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-[#0F1E36]">{feat.feature}</td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{feat.group}</td>
                  <td className="py-3 px-4 text-slate-700 max-w-md">{feat.description}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    <span
                      className={
                        feat.missingPct > 15
                          ? 'text-[#B91C1C] font-semibold'
                          : feat.missingPct > 8
                          ? 'text-[#B45309] font-medium'
                          : 'text-slate-600'
                      }
                    >
                      {feat.missingPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{feat.imputationStrategy}</td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                    {feat.medianOrMode}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center justify-end gap-2 w-28">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0D9488]"
                          style={{ width: `${(feat.importance / 0.24) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono tabular-nums font-semibold text-[#0F1E36]">
                        {feat.importance.toFixed(2)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive HMEQ Sample Records Explorer */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#0D9488] shrink-0" />
            <div>
              <h3 className="text-base font-bold text-[#0F1E36]">
                HMEQ Benchmark Loan Records Explorer
              </h3>
              <p className="text-xs text-slate-500">
                Inspect raw HMEQ loan records (including missing DEBTINC cases) and load any row directly into the real-time FastAPI screener.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID, JOB, REASON..."
                aria-label="Search HMEQ records"
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setRecordFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  recordFilter === 'all' ? 'bg-white text-[#0F1E36] shadow-xs' : 'text-slate-600'
                }`}
              >
                All ({SAMPLE_HMEQ_RECORDS.length})
              </button>
              <button
                type="button"
                onClick={() => setRecordFilter('defaulted')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  recordFilter === 'defaulted' ? 'bg-white text-[#B91C1C] shadow-xs' : 'text-slate-600'
                }`}
              >
                BAD = 1 (Defaulted)
              </button>
              <button
                type="button"
                onClick={() => setRecordFilter('repaid')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  recordFilter === 'repaid' ? 'bg-white text-[#15803D] shadow-xs' : 'text-slate-600'
                }`}
              >
                BAD = 0 (Repaid)
              </button>
              <button
                type="button"
                onClick={() => setRecordFilter('missing-dti')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  recordFilter === 'missing-dti' ? 'bg-white text-[#B45309] shadow-xs' : 'text-slate-600'
                }`}
              >
                Missing DEBTINC
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                <th className="py-2.5 px-4">Record ID</th>
                <th className="py-2.5 px-4">Target (BAD)</th>
                <th className="py-2.5 px-4 text-right">LOAN</th>
                <th className="py-2.5 px-4 text-right">MORTDUE</th>
                <th className="py-2.5 px-4 text-right">VALUE</th>
                <th className="py-2.5 px-4">REASON</th>
                <th className="py-2.5 px-4">JOB</th>
                <th className="py-2.5 px-4 text-right">DELINQ</th>
                <th className="py-2.5 px-4 text-right">DEROG</th>
                <th className="py-2.5 px-4 text-right">CLAGE</th>
                <th className="py-2.5 px-4 text-right">DEBTINC</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500">
                    No HMEQ records match your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.recordId} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono font-semibold text-[#0F1E36]">
                      {rec.recordId}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold">
                      <span className={rec.BAD === 1 ? 'text-[#B91C1C]' : 'text-[#15803D]'}>
                        {rec.BAD === 1 ? '1 · Defaulted' : '0 · Repaid'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      ${rec.LOAN.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {rec.MORTDUE ? `$${rec.MORTDUE.toLocaleString()}` : 'NaN'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {rec.VALUE ? `$${rec.VALUE.toLocaleString()}` : 'NaN'}
                    </td>
                    <td className="py-2.5 px-4 font-mono">{rec.REASON ?? 'NaN'}</td>
                    <td className="py-2.5 px-4 font-mono">{rec.JOB ?? 'NaN'}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{rec.DELINQ ?? 0}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{rec.DEROG ?? 0}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{rec.CLAGE ?? 0}m</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                      {rec.DEBTINC === null ? (
                        <span className="text-[#B45309] font-semibold">NaN (Impute 34.8%)</span>
                      ) : (
                        `${rec.DEBTINC.toFixed(1)}%`
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleLoadRecord(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#0F766E] bg-[#F0FDFA] hover:bg-[#CCFBF1] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Screen Applicant
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
