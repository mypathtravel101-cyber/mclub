# Japan Property Investment Risk Model (ML V2)

84-scenario stress test + ML probability-weighted analysis for Japanese real estate investment, denominated in HKD.

## Overview

This project provides a rigorous, three-layer analytical framework for evaluating Japanese property investments from a Hong Kong investor's perspective:

1. **Historical Data Validation** — 104 quarterly samples from FRED/BIS, 65 overlapping 10-year windows
2. **84-Scenario Stress Test** — 7 FX rates x 4 price changes x 3 holding periods = 84 discrete scenarios
3. **ML Probability Weighting** — 4 models (XGBoost/LightGBM/RF/GBR) + 10,000 Monte Carlo simulations with t-distribution

## Model Architecture

```
FRED/BIS Data (JPY/USD, Property Index, US Rate, JP Rate)
        |
        v
  Feature Engineering (15 FX features + 12 Property features)
        |
        v
  4-Model Ensemble (5-fold TimeSeries CV)
        |
        v
  Monte Carlo Simulation (10,000 runs, t-distribution, fat tails)
        |
        v
  Probability Mapping → 84 Scenarios
        |
        v
  Weighted ROI by Holding Period (5yr / 7yr / 10yr)
```

## Key Results (Base Case: HKD 3.2M → JPY 62.4M, Entry FX 19.5)

| Holding Period | Simple Avg ROI | ML Weighted ROI | Expected Net Gain (HKD) |
|---------------|----------------|-----------------|------------------------|
| 5 years       | +43.4%         | +38.1%          | ~+73 万                 |
| 7 years       | +62.1%         | +56.2%          | ~+108 万                |
| 10 years      | +90.7%         | +84.0%          | ~+161 万                |

**Key finding:** Even the worst-case 10-year scenario (out of all 84) still yields positive returns.

## Directory Structure

```
jp-investment-risk-model/
├── app-idea/                  # Mobile app brainstorm & design docs
├── ml-model/                  # Core ML model
│   ├── ml_japan_property_v2.py   # V2 model source code
│   ├── charts/                    # All visualization charts (PNG)
│   └── data/                      # ML results JSON
├── reports/                   # Generated reports
│   └── v6/                       # V6 report parts (PDF)
├── scripts/                   # Report generation scripts
└── README.md
```

## Data Sources

| Data | Source | Frequency | Points |
|------|--------|-----------|--------|
| JPY/USD FX Rate | FRED EXJPUS | Monthly | 665 (1971-2026) |
| Japan Residential Price Index | BIS QJPN628BIS | Quarterly | 284 (1955-2025) |
| US Federal Funds Rate | FRED FEDFUNDS | Monthly | 863 (1954-2026) |
| Japan Policy Rate | FRED IRSTCI01JPM156N | Monthly | 490 (1985-2026) |

## Model Performance (5-fold TimeSeries CV)

| Target | XGBoost | LightGBM | RandomForest | GBR (Best) |
|--------|---------|----------|--------------|------------|
| FX 10yr Change | 20.69% | 22.88% | 23.74% | **19.70%** |
| Property 10yr Change | 16.08% | 20.69% | 16.23% | **15.57%** |