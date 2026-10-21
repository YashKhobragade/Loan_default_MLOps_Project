import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SLIDE_10_EXAMPLE_INPUT,
  classifyRiskBand,
  validateApplicantInput,
  preprocessApplicant,
  predictLoanDefault,
  evaluatePromotionGate,
  calculateDriftSimulation,
  HMEQ_MEDIANS,
} from './mlopsEngine';

test('Slide 10 FastAPI /predict canonical example matches exact 0.72 High risk output', () => {
  const result = predictLoanDefault(SLIDE_10_EXAMPLE_INPUT, 'rf-v3');
  assert.equal(result.default_probability, 0.72);
  assert.equal(result.risk_label, 'High');
  assert.equal(result.model_version, 'loan-default-rf v3');
});

test('classifyRiskBand maps Low (<0.30), Medium (0.30-0.60), and High (>0.60) accurately', () => {
  assert.equal(classifyRiskBand(0.15), 'Low');
  assert.equal(classifyRiskBand(0.29), 'Low');
  assert.equal(classifyRiskBand(0.30), 'Medium');
  assert.equal(classifyRiskBand(0.60), 'Medium');
  assert.equal(classifyRiskBand(0.61), 'High');
  assert.equal(classifyRiskBand(0.85), 'High');
});

test('preprocessApplicant performs median/mode imputation, one-hot encoding, and missing DEBTINC signal detection', () => {
  const missingInput = {
    ...SLIDE_10_EXAMPLE_INPUT,
    DEBTINC: null,
    JOB: null,
  };
  const prep = preprocessApplicant(missingInput);
  assert.equal(prep.debtIncMissingSignal, true);
  assert.equal(prep.imputed.DEBTINC, HMEQ_MEDIANS.DEBTINC);
  assert.equal(prep.imputed.JOB, 'Other');
  assert.equal(prep.oneHotEncoded.REASON_DebtCon, 1);
  assert.equal(prep.oneHotEncoded.REASON_HomeImp, 0);
  assert.equal(prep.oneHotEncoded.JOB_Other, 1);
  assert.ok(prep.imputedFields.includes('DEBTINC'));
  assert.ok(prep.imputedFields.includes('JOB'));
});

test('validateApplicantInput catches invalid schema ranges', () => {
  const validRes = validateApplicantInput(SLIDE_10_EXAMPLE_INPUT);
  assert.equal(validRes.valid, true);

  const invalidRes = validateApplicantInput({
    ...SLIDE_10_EXAMPLE_INPUT,
    LOAN: -500,
    DEROG: 2.5,
  });
  assert.equal(invalidRes.valid, false);
  assert.ok(invalidRes.errors.LOAN);
  assert.ok(invalidRes.errors.DEROG);
});

test('evaluatePromotionGate enforces Slide 9 rule: recall >= prod recall and ROC-AUC drop <= 0.01', () => {
  // Pass when recall matches or beats prod and ROC-AUC drops by at most 0.01
  const passGate = evaluatePromotionGate({
    candidateRecall: 0.79,
    candidateRocAuc: 0.94,
    productionRecall: 0.79,
    productionRocAuc: 0.95,
  });
  assert.equal(passGate.passed, true);

  // Fail when recall drops below production
  const failRecall = evaluatePromotionGate({
    candidateRecall: 0.78,
    candidateRocAuc: 0.96,
    productionRecall: 0.79,
    productionRocAuc: 0.95,
  });
  assert.equal(failRecall.passed, false);
  assert.equal(failRecall.recallPassed, false);

  // Fail when ROC-AUC drops by more than 0.01
  const failRoc = evaluatePromotionGate({
    candidateRecall: 0.81,
    candidateRocAuc: 0.93,
    productionRecall: 0.79,
    productionRocAuc: 0.95,
  });
  assert.equal(failRoc.passed, false);
  assert.equal(failRoc.rocAucPassed, false);
});

test('calculateDriftSimulation reproduces Slide 11 drift metrics (3 of 12 drifted, 0.70 recall -> 0.78 after retrain)', () => {
  const drifted = calculateDriftSimulation('severe', false);
  assert.equal(drifted.driftedFeaturesCount, 3);
  assert.equal(drifted.totalFeatures, 12);
  assert.equal(drifted.currentRecall, 0.70);
  assert.equal(drifted.alertTriggered, true);

  const retrained = calculateDriftSimulation('severe', true);
  assert.equal(retrained.currentRecall, 0.78);
  assert.equal(retrained.alertTriggered, false);
  assert.equal(retrained.activeModelVersion, 'loan-default-rf v4 (retrained)');
});
