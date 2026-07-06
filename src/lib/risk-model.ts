/**
 * Japan Property Investment Risk Model — Core Calculation Engine
 * ============================================================
 * 84-scenario stress test + ML V2 probability weighting
 * Based on: JpyProperty_fx model_methodology chart
 *
 * Chart parameters:
 *   Entry: HKD 320萬 → JPY 6,240萬 (equity) at FX 19.5
 *   LTV 40% → Total property = 10,400萬 JPY, Loan = 4,160萬 JPY
 *   Mortgage: 3%/yr, 35-year amortizing
 *   Rental yield: 6%, Annual holding cost: 0.3%, Transaction cost: 0.3%/yr
 *   Purchase cost: 0.3% one-time
 *
 * Core formula:
 *   最終 HKD 盈虧 = (物業JPY價值 - 未還貸款 + 租金淨收入) ÷ 匯率 - 入場HKD本金
 *
 *   租金淨收入 = 租金 - 持有成本 - 交易成本 - 買入成本 - 按揭利息
 *   (按揭本金償還不是成本 — 它轉化為物業淨值)
 */

// ── Scenario Grid Definitions (from chart Section 3) ──
export const FX_LEVELS = [13.0, 16.0, 19.5, 22.0, 24.0, 26.0, 28.0];
export const PRICE_CHANGES_ANNUAL = [-3, 0, 1.5, 3]; // 4 annual % change levels
export const HOLDING_PERIODS = [5, 7, 10] as const;
// 7 FX × 4 price × 3 holding = 84 scenarios

// ── Default Mortgage Term ──
const MORTGAGE_TERM_YEARS = 35;

export interface RiskModelInput {
  principalHKD: number;       // 入場本金 (HKD), default 3,200,000
  entryFX: number;            // 入場匯率 JPY/HKD, default 19.5
  ltv: number;                // 貸款成數 %, default 40
  mortgageRate: number;       // 按揭利率 %, default 3
  mortgageTermYears: number;  // 按揭年期, default 35
  rentalYield: number;        // 年租金回報 %, default 6
  holdingCostRate: number;    // 每年持有成本 %, default 0.3 (管理費等)
  transactionCostRate: number;// 每年交易/稅務成本 %, default 0.3
  purchaseCostRate: number;   // 買入成本 %, default 0.3 (one-time)
  holdingPeriod: number;      // 持有年期, default 10
  propertyPriceJPY: number;   // 物業價格 (JPY), auto-calculated if 0
}

export interface ScenarioResult {
  fx: number;                  // Exit FX rate
  priceChangeAnnual: number;   // Annual price change %
  holdingYears: number;        // Holding period
  propertyEndValueJPY: number; // Property value at exit
  remainingLoanJPY: number;    // Remaining mortgage balance
  totalRentJPY: number;        // Gross rental income over holding period
  totalCostsJPY: number;       // Total costs (holding + transaction + purchase + interest)
  netRentalIncomeJPY: number;  // Rent minus all costs (incl. mortgage interest)
  totalJPYProceeds: number;    // End value - remaining loan + net rental income
  netGainHKD: number;          // Final HKD profit/loss
  roi: number;                 // Return on Investment %
  probability: number;         // ML-weighted probability (0-1)
}

export interface RiskModelOutput {
  scenarios: ScenarioResult[];
  summary: {
    holdingPeriod: number;
    simpleAvgROI: number;
    mlWeightedROI: number;
    worstCaseROI: number;
    bestCaseROI: number;
    expectedNetGainHKD: number;
    simpleAvgNetGainHKD: number;
    worstCaseNetGainHKD: number;
    bestCaseNetGainHKD: number;
    probPositiveReturn: number;
    propertyValueJPY: number;
    equityJPY: number;
    loanAmountJPY: number;
    propertyValueHKD: number;
    equityHKD: number;
    expectedEndValueHKD: number;
    totalRentHKD: number;
    totalCostsHKD: number;
  };
  mlPredictions: {
    fx10yrChange: { mean: number; p5: number; p50: number; p95: number };
    property10yrChange: { mean: number; p5: number; p50: number; p95: number };
  };
}

// ── ML V2 Distribution Parameters (from chart Section 4) ──
const ML_PARAMS = {
  fx10yr: { mean: 7.8, std: 24.0, p5: -31.1, p50: 7.6, p95: 47.1 },
  property10yr: { mean: 5.0, std: 18.0, p5: -24.7, p50: 4.8, p95: 35.0 },
};

/**
 * Gaussian probability density function
 */
function gaussianPDF(x: number, mean: number, std: number): number {
  const exponent = -0.5 * Math.pow((x - mean) / std, 2);
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
}

/**
 * Calculate monthly mortgage payment (amortizing P&I)
 */
function calcMonthlyPayment(loanAmount: number, annualRate: number, termYears: number): number {
  const monthlyRate = annualRate / 12;
  const totalMonths = termYears * 12;
  if (monthlyRate <= 0) return loanAmount / totalMonths;
  return (
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );
}

/**
 * Calculate remaining loan balance after 'paidMonths' payments
 */
function calcRemainingBalance(
  monthlyPayment: number,
  annualRate: number,
  remainingMonths: number
): number {
  const monthlyRate = annualRate / 12;
  if (remainingMonths <= 0) return 0;
  if (monthlyRate <= 0) return monthlyPayment * remainingMonths;
  return (
    (monthlyPayment * (Math.pow(1 + monthlyRate, remainingMonths) - 1)) /
    (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths))
  );
}

/**
 * Run the full 84-scenario stress test with ML V2 probability weighting
 */
export function runRiskModel(input: RiskModelInput): RiskModelOutput {
  const {
    principalHKD,
    entryFX,
    ltv,
    mortgageRate,
    mortgageTermYears = MORTGAGE_TERM_YEARS,
    rentalYield,
    holdingCostRate,
    transactionCostRate,
    purchaseCostRate,
    holdingPeriod,
  } = input;

  // ── Property value and LTV breakdown ──
  // principalHKD is the total property price in HKD
  // LTV = loan as % of property value
  const propertyValueJPY = input.propertyPriceJPY > 0
    ? input.propertyPriceJPY
    : principalHKD * entryFX;
  const loanAmountJPY = propertyValueJPY * (ltv / 100);
  const equityJPY = propertyValueJPY - loanAmountJPY;

  // ── Mortgage calculations ──
  const annualRate = mortgageRate / 100;
  const monthlyPayment = calcMonthlyPayment(loanAmountJPY, annualRate, mortgageTermYears);
  const totalMortgageMonths = mortgageTermYears * 12;

  // ── Run all 84 scenarios ──
  const scenarios: ScenarioResult[] = [];
  let totalProbability = 0;

  for (const fx of FX_LEVELS) {
    for (const priceChangeAnnual of PRICE_CHANGES_ANNUAL) {
      for (const years of HOLDING_PERIODS) {
        // Property end value: compound annual price change
        const totalPriceChange = Math.pow(1 + priceChangeAnnual / 100, years) - 1;
        const propertyEndValueJPY = propertyValueJPY * (1 + totalPriceChange);

        // Remaining loan balance after 'years' of payments
        const paidMonths = years * 12;
        const remainingMonths = totalMortgageMonths - paidMonths;
        const remainingLoanJPY =
          remainingMonths > 0
            ? calcRemainingBalance(monthlyPayment, annualRate, remainingMonths)
            : 0;

        // Total mortgage payments and interest
        const totalMortgagePaidJPY = monthlyPayment * paidMonths;
        const principalRepaidJPY = loanAmountJPY - remainingLoanJPY;
        const mortgageInterestJPY = totalMortgagePaidJPY - principalRepaidJPY;

        // Rental income
        const totalRentJPY = propertyValueJPY * (rentalYield / 100) * years;

        // Costs
        const totalHoldingCostJPY = propertyValueJPY * (holdingCostRate / 100) * years;
        const totalTransactionCostJPY = propertyValueJPY * (transactionCostRate / 100) * years;
        const purchaseCostJPY = propertyValueJPY * (purchaseCostRate / 100); // one-time

        // Net rental income = rent - all costs (including mortgage INTEREST)
        // Mortgage PRINCIPAL repayment is NOT a cost — it converts to equity
        const totalCostsJPY =
          totalHoldingCostJPY + totalTransactionCostJPY + purchaseCostJPY + mortgageInterestJPY;
        const netRentalIncomeJPY = totalRentJPY - totalCostsJPY;

        // Core formula:
        // 最終 HKD 盈虧 = (物業JPY價值 - 未還貸款 + 租金淨收入) ÷ 匯率 - 自付HKD本金
        const equityHKD = equityJPY / entryFX;
        const totalJPYProceeds = propertyEndValueJPY - remainingLoanJPY + netRentalIncomeJPY;
        const netGainHKD = totalJPYProceeds / fx - equityHKD;
        const roi = (netGainHKD / equityHKD) * 100;

        // ML V2 probability: map scenario to ML distribution
        // FX change % relative to entry FX
        const fxChangePercent = ((fx - entryFX) / entryFX) * 100;
        // Total property price change % over holding period
        const priceChangeTotalPercent = totalPriceChange * 100;
        // Scale to 10-year equivalent for ML distribution matching
        const scaleFactor = 10 / years;
        const fxChange10yr = fxChangePercent * scaleFactor;
        const priceChange10yr = priceChangeTotalPercent * scaleFactor;

        const fxProb = gaussianPDF(fxChange10yr, ML_PARAMS.fx10yr.mean, ML_PARAMS.fx10yr.std);
        const propProb = gaussianPDF(
          priceChange10yr,
          ML_PARAMS.property10yr.mean,
          ML_PARAMS.property10yr.std
        );
        const rawProb = fxProb * propProb;

        scenarios.push({
          fx,
          priceChangeAnnual,
          holdingYears: years,
          propertyEndValueJPY,
          remainingLoanJPY,
          totalRentJPY,
          totalCostsJPY,
          netRentalIncomeJPY,
          totalJPYProceeds,
          netGainHKD,
          roi,
          probability: rawProb, // Will normalize later
        });

        totalProbability += rawProb;
      }
    }
  }

  // ── Normalize probabilities across all 84 scenarios ──
  for (const s of scenarios) {
    s.probability = totalProbability > 0 ? s.probability / totalProbability : 1 / scenarios.length;
  }

  // ── Filter scenarios for the selected holding period ──
  const filteredScenarios = scenarios.filter((s) => s.holdingYears === holdingPeriod);
  const filteredTotalProb = filteredScenarios.reduce((sum, s) => sum + s.probability, 0);

  // Re-normalize within the holding period
  const normalizedFiltered = filteredScenarios.map((s) => ({
    ...s,
    probability: s.probability / filteredTotalProb,
  }));

  // ── Calculate summary metrics ──
  const simpleAvgROI =
    normalizedFiltered.reduce((sum, s) => sum + s.roi, 0) / normalizedFiltered.length;
  const mlWeightedROI = normalizedFiltered.reduce(
    (sum, s) => sum + s.roi * s.probability,
    0
  );
  const worstCaseROI = Math.min(...normalizedFiltered.map((s) => s.roi));
  const bestCaseROI = Math.max(...normalizedFiltered.map((s) => s.roi));
  const expectedNetGainHKD = normalizedFiltered.reduce(
    (sum, s) => sum + s.netGainHKD * s.probability,
    0
  );
  const simpleAvgNetGainHKD =
    normalizedFiltered.reduce((sum, s) => sum + s.netGainHKD, 0) / normalizedFiltered.length;
  const worstCaseNetGainHKD = Math.min(...normalizedFiltered.map((s) => s.netGainHKD));
  const bestCaseNetGainHKD = Math.max(...normalizedFiltered.map((s) => s.netGainHKD));
  const probPositiveReturn = normalizedFiltered
    .filter((s) => s.roi > 0)
    .reduce((sum, s) => sum + s.probability, 0);

  // Property value breakdown
  const propertyValueHKD = Math.round(propertyValueJPY / entryFX);
  const equityHKD = Math.round(equityJPY / entryFX);
  const expectedEndValueHKD = normalizedFiltered.reduce(
    (sum, s) => sum + (s.propertyEndValueJPY / s.fx) * s.probability,
    0
  );
  const totalRentJPY = propertyValueJPY * (rentalYield / 100) * holdingPeriod;
  const mlWeightedExitFX = normalizedFiltered.reduce(
    (sum, s) => sum + s.fx * s.probability,
    0
  );
  const totalRentHKD = totalRentJPY / mlWeightedExitFX;
  const totalCostsHKD = normalizedFiltered.reduce(
    (sum, s) => sum + (s.totalCostsJPY / s.fx) * s.probability,
    0
  );

  return {
    scenarios,
    summary: {
      holdingPeriod,
      simpleAvgROI: Math.round(simpleAvgROI * 10) / 10 || 0,
      mlWeightedROI: Math.round(mlWeightedROI * 10) / 10 || 0,
      worstCaseROI: Math.round(worstCaseROI * 10) / 10 || 0,
      bestCaseROI: Math.round(bestCaseROI * 10) / 10 || 0,
      expectedNetGainHKD: Math.round(expectedNetGainHKD),
      simpleAvgNetGainHKD: Math.round(simpleAvgNetGainHKD),
      worstCaseNetGainHKD: Math.round(worstCaseNetGainHKD),
      bestCaseNetGainHKD: Math.round(bestCaseNetGainHKD),
      probPositiveReturn: Math.round(probPositiveReturn * 1000) / 10,
      propertyValueJPY: Math.round(propertyValueJPY),
      equityJPY: Math.round(equityJPY),
      loanAmountJPY: Math.round(loanAmountJPY),
      propertyValueHKD: Math.round(propertyValueHKD),
      equityHKD,
      expectedEndValueHKD: Math.round(expectedEndValueHKD),
      totalRentHKD: Math.round(totalRentHKD),
      totalCostsHKD: Math.round(totalCostsHKD),
    },
    mlPredictions: {
      fx10yrChange: ML_PARAMS.fx10yr,
      property10yrChange: ML_PARAMS.property10yr,
    },
  };
}

/**
 * Format number as HKD with 萬 suffix
 */
export function formatHKD(amount: number): string {
  const wan = amount / 10000;
  if (Math.abs(wan) >= 1) {
    return `${wan >= 0 ? '+' : ''}${wan.toFixed(0)}萬`;
  }
  return `${amount >= 0 ? '+' : ''}${(amount / 1000).toFixed(0)}千`;
}

/**
 * Format large JPY amounts
 */
export function formatJPY(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(1)}千萬`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}萬`;
  }
  return amount.toLocaleString();
}
